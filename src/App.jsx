import { RxCaretRight, RxCaretDown } from "react-icons/rx";
import { MdKeyboardArrowRight } from "react-icons/md";
import { BiUser } from "react-icons/bi";
import { FaChessPawn } from "react-icons/fa";
import { CgUser } from "react-icons/cg";
import { AiOutlineSearch } from "react-icons/ai";
import React, { useState, useEffect, useRef } from "react";
import ChessBoard from "./components/ChessBoard";
import GamesLists from "./components/GamesLists";
import "./App.css";
import defaultimg from "./assets/default.png";
import { getMonthlyGames } from "./lib/chesscom";
import ecoA from "./data/ecoA.json";
import ecoB from "./data/ecoB.json";
import ecoC from "./data/ecoC.json";
import ecoD from "./data/ecoD.json";
import ecoE from "./data/ecoE.json";
import { Chess } from "chess.js";
import KnightBoard from "./components/KnightBoard";

const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const combinedOpenings = { ...ecoA, ...ecoB, ...ecoC, ...ecoD, ...ecoE };
const openingMap = new Map();

Object.values(combinedOpenings).forEach((obj) => {
  if (obj?.eco && obj?.name) {
    const baseName = obj.name.split(/[:|,]/)[0].trim();
    if (!openingMap.has(baseName)) {
      openingMap.set(baseName, []);
    }
    openingMap.get(baseName).push(normalizeMoves(obj.moves));
  }
});

function normalizeMoves(moves) {
  return moves.replace(/\d+\.\s?/g, "").trim();
}

const App = () => {
  const [username, setUsername] = useState("");
  const [profile, setProfile] = useState(null);
  const [archiveMap, setArchiveMap] = useState({});
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [monthlyGames, setMonthlyGames] = useState({});
  const [displayedGames, setDisplayedGames] = useState([]);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadedGames, setLoadedGames] = useState(false);
  const [filteredGames, setFilteredGames] = useState([]);
  const [opponentList, setOpponentList] = useState([]);
  const [progress, setProgress] = useState(0);
  const [hasSelectedFilter, setHasSelectedFilter] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [dropdownList, setDropdownList] = useState([]);
  const [archives, setArchives] = useState({});
  const [year, setYear] = useState(null);
  const yearRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`https://api.chess.com/pub/player/${username}`);
      const data = await res.json();
      setProfile(data);

      const archiveRes = await fetch(
        `https://api.chess.com/pub/player/${username}/games/archives`
      );
      const archiveData = await archiveRes.json();
      const archiveUrls = archiveData.archives;

      const map = {};
      archiveUrls.forEach((url) => {
        const match = url.match(/\/(\d{4})\/(\d{1,2})$/);
        if (match) {
          const year = match[1];
          const month = match[2].padStart(2, "0");
          if (!map[year]) map[year] = [];
          map[year].push(month);
        }
      });

      Object.keys(map).forEach((year) => {
        map[year] = map[year].sort((a, b) => Number(a) - Number(b));
      });

      const sortedYears = Object.keys(map).sort((a, b) => b - a);
      const mostRecentYear = sortedYears[0];
      const mostRecentMonth =
        map[mostRecentYear][map[mostRecentYear].length - 1];

      setArchiveMap(map);
      setSelectedYear(mostRecentYear);
      setSelectedMonth(mostRecentMonth);

      const key = `${mostRecentYear}-${mostRecentMonth}`;
      const games = await getMonthlyGames(
        username,
        parseInt(mostRecentYear),
        parseInt(mostRecentMonth)
      );
      setMonthlyGames({ [key]: games });
      setDisplayedGames(games);
    } catch (err) {
      console.error("Error fetching profile/games:", err);
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 3000);
      // setLoading(false);
    }
  };

  const handleMonthClick = async (monthIndex) => {
    setLoadedGames(true);
    const monthNum = String(monthIndex + 1).padStart(2, "0");
    const key = `${selectedYear}-${monthNum}`;
    setSelectedMonth(monthNum);

    if (monthlyGames[key]) {
      setDisplayedGames(monthlyGames[key]);
      return;
    }

    const games = await getMonthlyGames(
      username,
      parseInt(selectedYear),
      parseInt(monthNum)
    );
    setMonthlyGames((prev) => ({ ...prev, [key]: games }));
    setDisplayedGames(games);
  };

  const handleYearClick = async (year) => {
    setLoadedGames(true);
    setSelectedYear(year);
    const months = archiveMap[year];
    const lastMonth = months[months.length - 1];
    setSelectedMonth(lastMonth);

    const key = `${year}-${lastMonth}`;
    if (monthlyGames[key]) {
      setDisplayedGames(monthlyGames[key]);

      return;
    }

    const games = await getMonthlyGames(
      username,
      parseInt(year),
      parseInt(lastMonth)
    );
    setMonthlyGames((prev) => ({ ...prev, [key]: games }));
    setDisplayedGames(games);
  };

  const isMonthAvailable = (monthIndex) => {
    const monthNum = String(monthIndex + 1).padStart(2, "0");
    return archiveMap[selectedYear]?.includes(monthNum);
  };

  function getGameOutcome(game, username) {
    const userIsWhite =
      game.white.username.toLowerCase() === username.toLowerCase();
    const userResult = userIsWhite ? game.white.result : game.black.result;
    const opponentResult = userIsWhite ? game.black.result : game.white.result;

    const winResults = [
      "win",
      "checkmated",
      "resigned",
      "timeout",
      "abandoned",
      "agreed",
      "repetition",
      "stalemate",
      "timevsinsufficient",
      "insufficient",
    ];
    const lossResults = ["checkmated", "resigned", "timeout", "abandoned"];

    if (userResult === "win") return "win";

    // Handle losses (you were checkmated, resigned, etc.)
    if (lossResults.includes(userResult)) return "loss";

    // Handle draws: if it's not a win or loss, treat as draw
    return "draw";
  }

  const extractRootName = (name) => {
    const commonSuffixes = [
      "Opening",
      "Game",
      "Gambit",
      "Defense",
      "Attack",
      "Variation",
    ];

    const parts = name.split(/\s+/);

    // Only strip the suffix if there's more than 2 words (preserves "King's Pawn")
    if (parts.length >= 3 && commonSuffixes.includes(parts[parts.length - 1])) {
      return parts.slice(0, -1).join(" ");
    }

    // If the last word is a suffix and there's at least 2 words, strip it
    if (parts.length >= 2 && commonSuffixes.includes(parts[parts.length - 1])) {
      return parts.slice(0, -1).join(" ");
    }

    return name;
  };

  function mergeSimilarOpenings(openingsObj) {
    const grouped = {};
    const keywords = ["game", "opening", "defense", "defence"];

    for (const [name, count] of Object.entries(openingsObj)) {
      const base = name.toLowerCase().split(/\s+/)[0]; // use first word as base

      if (!grouped[base]) grouped[base] = [];

      grouped[base].push({ name, count });
    }

    const merged = {};

    for (const group of Object.values(grouped)) {
      // Sort group by presence of keyword and then by count
      group.sort((a, b) => {
        const aHasKeyword = keywords.some((k) =>
          a.name.toLowerCase().includes(k)
        );
        const bHasKeyword = keywords.some((k) =>
          b.name.toLowerCase().includes(k)
        );
        if (aHasKeyword !== bHasKeyword) return bHasKeyword - aHasKeyword;
        return b.count - a.count; // fallback: highest count wins
      });

      const mergedName = group[0].name;
      const total = group.reduce((sum, item) => sum + item.count, 0);

      merged[mergedName] = total;
    }

    return merged;
  }

  function getOpeningNameFromMoves(movesStr, eco = null) {
    const normalizedMoves = normalizeMoves(movesStr);
    const gameMoves = normalizedMoves.split(/\s+/);
    let bestMatch = null;
    let bestLength = 0;

    for (const [openingName, variations] of openingMap.entries()) {
      for (const variation of variations) {
        const variationMoves = variation.split(/\s+/);

        let matches = true;
        for (let i = 0; i < variationMoves.length; i++) {
          if (variationMoves[i] !== gameMoves[i]) {
            matches = false;
            break;
          }
        }

        if (matches && variationMoves.length > bestLength) {
          bestMatch = openingName;
          bestLength = variationMoves.length;
        }
      }
    }

    let finalName = bestMatch;

    // fallback to ECO if nothing matched
    if (!finalName && eco) {
      const opening = Object.values(combinedOpenings).find(
        (o) => o.eco === eco
      );
      if (opening) {
        finalName = opening.name;
      }
    }

    // Normalize to root name if available
    if (finalName) {
      return extractRootName(finalName);
    }

    return null;
  }

  const generateOpponentOpeningList = async (games) => {
    const opponents = {};
    const openings = {};

    for (const game of games) {
      const opponent =
        game.white.username.toLowerCase() === username.toLowerCase()
          ? game.black.username
          : game.white.username;

      opponents[opponent] = (opponents[opponent] || 0) + 1;

      try {
        const chess = new Chess();
        chess.loadPgn(game.pgn);
        const headers = chess.header();
        const eco = headers["ECO"] || null;

        const moves = chess
          .history({ verbose: true })
          .slice(0, 20)
          .map((m) => m.san)
          .join(" ");

        const openingName = getOpeningNameFromMoves(moves, eco);

        if (openingName) {
          openings[openingName] = (openings[openingName] || 0) + 1;
        }
      } catch (error) {
        console.error("Failed to parse PGN:", error);
      }
    }

    const opponentItems = Object.entries(opponents)
      .map(([name, count]) => ({
        type: "opponent",
        value: name,
        count,
      }))
      .sort((a, b) => b.count - a.count);

    const mergedOpenings = mergeSimilarOpenings(openings);

    const openingItems = Object.entries(mergedOpenings)
      .map(([name, count]) => ({
        type: "opening",
        value: name,
        count,
      }))
      .sort((a, b) => b.count - a.count);

    setOpponentList([...opponentItems, ...openingItems]); // <- add this
    setDropdownList([...opponentItems, ...openingItems]);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    filterGames(searchQuery);
  };

  const filterGames = (query) => {
    const q = query.toLowerCase();
    const filtered = displayedGames.filter((game) => {
      const opponent =
        game.white.username.toLowerCase() === username.toLowerCase()
          ? game.black.username
          : game.white.username;

      if (opponent.toLowerCase().includes(q)) return true;

      try {
        const chess = new Chess();
        chess.loadPgn(game.pgn);
        const headers = chess.header();
        const eco = headers["ECO"] || null;

        const moves = chess
          .history({ verbose: true })
          .slice(0, 20)
          .map((move) => move.san)
          .join(" ");

        const opening = getOpeningNameFromMoves(moves, eco) || "";
        return opening.toLowerCase().includes(q);
      } catch {
        return false;
      }
    });

    setFilteredGames(filtered);
    setHasSelectedFilter(true);
  };

  const handleSearchQueryChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (value.trim() === "") {
      setDropdownList(opponentList);
      return;
    }

    const filtered = dropdownList.filter((item) =>
      item.value.toLowerCase().includes(value.toLowerCase())
    );

    setDropdownList(filtered);
  };

  const handleDropdownSelect = async (item) => {
    setSearchQuery(item.value);
    setHasSelectedFilter(true);
    setIsFiltering(true);

    try {
      if (item.type === "opponent") {
        const filtered = displayedGames.filter((game) => {
          const opponent =
            game.white.username.toLowerCase() === username.toLowerCase()
              ? game.black.username
              : game.white.username;

          return opponent.toLowerCase() === item.value.toLowerCase();
        });

        setFilteredGames(filtered);
        setSelectedGame(null);
      }

      if (item.type === "opening") {
        const filtered = displayedGames.filter((game) => {
          try {
            const chess = new Chess();
            chess.loadPgn(game.pgn);
            const headers = chess.header();
            const eco = headers["ECO"] || null;
            const moves = chess.history().join(" ");
            const opening = getOpeningNameFromMoves(moves, eco);

            return opening?.toLowerCase() === item.value.toLowerCase();
          } catch {
            return false;
          }
        });

        setFilteredGames(filtered);
        setSelectedGame(null);
        const filteredDropdown = opponentList.filter((entry) =>
          entry.value.toLowerCase().includes(item.value.toLowerCase())
        );
        setDropdownList(filteredDropdown);
      }
    } finally {
      setIsFiltering(false);
    }
  };

  useEffect(() => {
    generateOpponentOpeningList(displayedGames);
  }, [displayedGames]);

  return (
    <div className="min-h-screen bg-[#0D0D0D]">
      {!profile ? (
        <div className="flex flex-col items-center px-10 max-md:px-5 space-y-6 h-[100svh] justify-center">
          <h2 className="text-2xl font-semibold text-white text-center">
            Enter your Chess.com username
          </h2>
          <form onSubmit={handleSubmit} className="w-full max-w-md">
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 outline-none focus:border-[#5ED3F3] border border-transparent rounded-lg bg-[#1e1e1e] text-white placeholder:text-[#a0a0a0]"
                placeholder="Username"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <AiOutlineSearch size={20} />
              </button>
            </div>
          </form>
        </div>
      ) : (
        <>
          {loading ? (
            <div className="h-[100vh] scale-[0.3] flex justify-center items-center">
              <KnightBoard />
            </div>
          ) : (
            <>
              <header className="shadow-md flex justify-between px-10 py-5 items-center max-md:px-5 gap-5 relative">
                <div className="flex gap-10 justify-between items-center h-full">
                  <div className="text-3xl font-bold text-[#fff] max-lg:text-xl max-md:text-lg">
                    ChessMore
                  </div>
                </div>

                <div className="flex items-center space-x-4 h-full">
                  <div className="text-xl font-semibold text-[#fff]">
                    {profile?.username}
                  </div>
                  <img
                    src={profile?.avatar || defaultimg}
                    alt={profile?.username}
                    className="w-12 h-12 rounded-full max-lg:size-10 max-md:size-9"
                  />
                </div>
              </header>

              <main className="max-w-7xl mx-auto px-4 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1">
                    <div className="py-4 w-full">
                      <div className="flex flex-col space-y-2 relative">
                        <form onSubmit={handleSearch} className="relative">
                          <input
                            type="text"
                            placeholder="Search opponents or openings..."
                            value={searchQuery}
                            onChange={(e) => handleSearchQueryChange(e)}
                            onFocus={() => setShowDropdown(true)}
                            onBlur={() =>
                              setTimeout(() => setShowDropdown(false), 150)
                            }
                            className="w-full px-4 py-2 border border-transparent rounded-lg outline-none bg-[#1A1A1A] text-white focus:border-[#5ED3F3]"
                          />

                          <button
                            type="submit"
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                          >
                            <AiOutlineSearch size={20} />
                          </button>
                        </form>
                        {showDropdown && dropdownList.length > 0 && (
                          <ul className="rounded shadow-md max-h-40 overflow-y-auto absolte bottom-0">
                            {dropdownList.map((item, index) => (
                              <li
                                key={index}
                                className="px-4 py-2 hover:bg-[#171D27] text-white cursor-pointer flex justify-between mr-2 rounded"
                                onClick={() => handleDropdownSelect(item)}
                              >
                                <span className="text-sm gap-2 flex items-center ">
                                  {item.type === "opponent" ? (
                                    <CgUser />
                                  ) : (
                                    <FaChessPawn />
                                  )}
                                  {item.value}
                                </span>
                                <span className="text-sm font-bold">
                                  {item.count}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>

                    <ChessBoard
                      game={selectedGame}
                      pgn={selectedGame?.pgn}
                      username={profile?.username}
                      whiteresult={selectedGame?.white.result}
                      blackresult={selectedGame?.black.result}
                    />

                    {hasSelectedFilter && (
                      <div className="bg-[#1e1e1e] text-white shadow-md rounded-lg p-4 mt-4">
                        <h2 className="text-xl font-semibold mb-4">
                          Games with Selected Opening/Opponent
                        </h2>
                        {isFiltering ? (
                          <p className="text-gray-500 italic">
                            Loading games...
                          </p>
                        ) : filteredGames.length === 0 ? (
                          <p className="text-gray-500">No games found.</p>
                        ) : (
                          <ul className="space-y-2">
                            {filteredGames.map((game, index) => (
                              <li
                                key={index}
                                className="p-2 border border-[#494949] rounded-lg hover:bg-[#333] cursor-pointer flex items-center justify-between"
                                onClick={() => setSelectedGame(game)}
                              >
                                <div className="flex items-center gap-3 truncate w-[70%]">
                                  <BiUser className="shrink-0" />
                                  {game.white.username.toLocaleLowerCase() ===
                                  username.toLocaleLowerCase() ? (
                                    <div className="flex items-center gap-3 truncate">
                                      <div className="size-3 bg-black rounded-full border shrink-0"></div>
                                      <div className="truncate">
                                        {game.black.username}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-3">
                                      <div className="size-3 bg-white rounded-full border "></div>
                                      {game.white.username}
                                    </div>
                                  )}
                                </div>
                                <div className=" flex items-center gap-2">
                                  {getGameOutcome(game, username)}{" "}
                                  <RxCaretRight />
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="lg:col-span-2 pt-5">
                    <div className="flex justify-between max-md:flex-col">
                      {/* Month Selector */}
                      {selectedYear && (
                        <div className="flex gap-3 w-[70%] flex-wrap max-md:w-full max-md:gap-x-1 max-md:justify-evenly">
                          {monthNames.map((name, i) => {
                            const isAvailable = isMonthAvailable(i);
                            const monthNum = String(i + 1).padStart(2, "0");
                            const isActive = selectedMonth === monthNum;
                            return (
                              <button
                                key={name}
                                onClick={() =>
                                  isAvailable && handleMonthClick(i)
                                }
                                className={`px-3 py-1 rounded transition-colors ${
                                  isAvailable
                                    ? isActive
                                      ? "bg-[#5ED3F3] text-black"
                                      : "bg-[#222] text-white hover:bg-[#444]"
                                    : "bg-[#1e1e1e] text-gray-500 cursor-not-allowed"
                                }`}
                                disabled={!isAvailable}
                              >
                                {name}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      <div
                        className="relative max-md:pt-2 max-md:ml-auto"
                        ref={yearRef}
                      >
                        <button
                          onClick={() => setShowYearDropdown(!showYearDropdown)}
                          className="p-2 border rounded text-white bg-[#1e1e1e] w-24 flex items-center justify-between border-[#777]"
                        >
                          {selectedYear}
                          <RxCaretDown />
                        </button>
                        {showYearDropdown && (
                          <ul className="absolute z-10 mt-1 bg-[#1e1e1e] border rounded w-24 text-white border-[#777]">
                            {Object.keys(archiveMap)
                              .sort((a, b) => b - a)
                              .map((y) => (
                                <li
                                  key={y}
                                  className="px-4 py-2 hover:bg-[#333] cursor-pointer"
                                  onClick={() => {
                                    handleYearClick(y);
                                    setShowYearDropdown(false);
                                  }}
                                >
                                  {y}
                                </li>
                              ))}
                          </ul>
                        )}
                      </div>
                    </div>
                    <GamesLists
                      loading={loadedGames}
                      setLoading={setLoadedGames}
                      username={profile?.username}
                      onSelectGame={setSelectedGame}
                      games={displayedGames}
                    />
                  </div>
                </div>
              </main>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default App;
