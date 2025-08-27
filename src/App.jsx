import { RxCaretRight, RxCaretDown, RxCross2 } from "react-icons/rx";
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
import { getMonthlyGames, getUserArchivesAndGames } from "./lib/chesscom";
import { Chess } from "chess.js";
import KnightBoard from "./components/KnightBoard";
import Login from "./pages/Login";
import openingsData from "./data/openings.json";
import Navbar from "./components/Navbar";

const normalize = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9' ]/g, "")
    .split(" ")
    .filter(
      (w) =>
        w &&
        ![
          "opening",
          "game",
          "defense",
          "attack",
          "variation",
          "system",
        ].includes(w)
    )
    .join(" ")
    .trim();

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

function normalizeMoves(moves) {
  return moves.replace(/\d+\.\s?/g, "").trim();
}

const App = () => {
  const [error, setError] = useState("");
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
  const [hasSelectedFilter, setHasSelectedFilter] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [dropdownList, setDropdownList] = useState([]);
  const yearRef = useRef(null);
  const [currentFilteredPage, setCurrentFilteredPage] = useState(1);

  const [filterMode, setFilterMode] = useState("both");
  const gamesPerPage = 5;
  const [allDropdownList, setAllDropdownList] = useState([]);

  useEffect(() => {
    const storedUser = localStorage.getItem("username");
    if (storedUser) {
      setUsername(storedUser);
    }
  }, []);

  useEffect(() => {
    const savedUsername = localStorage.getItem("username");
    if (savedUsername) {
      setUsername(savedUsername);

      // Auto-login
      (async () => {
        try {
          setLoading(true);

          const {
            profile,
            archiveMap,
            mostRecentYear,
            mostRecentMonth,
            games,
            key,
          } = await getUserArchivesAndGames(savedUsername);

          setProfile(profile);
          setArchiveMap(archiveMap);
          setSelectedYear(mostRecentYear);
          setSelectedMonth(mostRecentMonth);
          setMonthlyGames({ [key]: games });
          setDisplayedGames(games);
        } catch (err) {
          console.error("Auto-login failed:", err);
          localStorage.removeItem("username"); // Remove invalid username
        } finally {
          setLoading(false);
        }
      })();
    }
  }, []);

  // Login Logic
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      setLoading(true);

      const {
        profile,
        archiveMap,
        sortedYears,
        mostRecentYear,
        mostRecentMonth,
        games,
        key,
      } = await getUserArchivesAndGames(username);

      // ✅ If we reach here, username is valid
      localStorage.setItem("username", username);

      const accounts = JSON.parse(localStorage.getItem("accounts")) || [];
      if (!accounts.includes(username)) {
        accounts.push(username);
        localStorage.setItem("accounts", JSON.stringify(accounts));
      }

      setProfile(profile);
      setArchiveMap(archiveMap);
      setSelectedYear(mostRecentYear);
      setSelectedMonth(mostRecentMonth);
      setMonthlyGames({ [key]: games });
      setDisplayedGames(games);
    } catch (err) {
      if (err.message === "Failed to fetch profile") {
        setError("Username not found. Please check and try again.");
      } else if (err.message === "Failed to fetch") {
        setError("Network error. Please check your connection.");
      } else {
        setError("An unexpected error occurred.");
      }
      console.error("Error fetching profile/games:", err);
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 3000);
    }
  };

  // Gamelist Logic
  const handleMonthClick = async (monthIndex) => {
    const monthNum = String(monthIndex + 1).padStart(2, "0");

    if (selectedMonth === monthNum) return;
    setLoadedGames(true);
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

  // Chessboard Logic
  function getGameOutcome(game, username) {
    const userIsWhite =
      game.white.username.toLowerCase() === username.toLowerCase();
    const userResult = userIsWhite ? game.white.result : game.black.result;
    const lossResults = ["checkmated", "resigned", "timeout", "abandoned"];

    if (userResult === "win") return "won";
    if (lossResults.includes(userResult)) return "lost";
    return "draw";
  }

  const filterGames = (id) => {
    const selectedItem = dropdownList.find((item) => item.id === id);
    if (!selectedItem) return;

    const { type, value } = selectedItem;

    const filtered = displayedGames.filter((game) => {
      if (type === "opponent") {
        const opponent =
          game.white.username.toLowerCase() === username.toLowerCase()
            ? game.black.username
            : game.white.username;

        return opponent.toLowerCase() === value.toLowerCase();
      }

      if (type === "opening") {
        try {
          const chess = new Chess();
          chess.loadPgn(game.pgn);
          const headers = chess.header();

          const openingName = headers.ECOUrl
            ? headers.ECOUrl.split("/")
                .pop()
                .replace(/-/g, " ")
                .replace(/\s+/g, " ")
                .replace(/'/g, "")
                .replace(/\d+\.{1,3}[a-z]?(\.\.\.)?.*\s*$/i, "")
                .split(":")[0]
                .split("(")[0]
                .trim()
                .toLowerCase()
            : "";

          const normOpening = normalize(openingName);

          const matchedMain = openingsData.reduce((best, main) => {
            const normMain = normalize(main);
            const mainWords = normMain.split(" ");
            const matchedWords = mainWords.filter((word) =>
              normOpening.includes(word)
            );
            const score = matchedWords.length / mainWords.length;
            // console.log("Matching Main Opening:", main, "Score:", score, mainWords, matchedWords);
            if (
              !best ||
              score > best.score ||
              (score === best.score && normMain.length > best.normMainLength)
            ) {
              return { value: main, score, normMainLength: normMain.length };
            }
            return best;
          }, null);

          return (
            matchedMain?.value.toLowerCase().includes(value.toLowerCase()) ||
            value.toLowerCase().includes(matchedMain?.value.toLowerCase())
          );
        } catch {
          return false;
        }
      }

      return false;
    });

    setFilteredGames(filtered);
    setHasSelectedFilter(true);
  };

  const handleSearchQueryChange = (e) => {
    const value = e.target.value;
    setShowDropdown(true);
    setSearchQuery(value);

    if (value.trim() === "") {
      setDropdownList(allDropdownList);
      return;
    }

    const filtered = allDropdownList.filter((item) => {
      const match = item.value.toLowerCase().includes(value.toLowerCase());

      if (!match) return false;
      if (filterMode === "opponents") return item.type === "opponent";
      if (filterMode === "openings") return item.type === "opening";
      return true;
    });

    setDropdownList(filtered);
  };

  const handleDropdownSelect = async (item) => {
    setSearchQuery(item.value); // still show the name in the search bar
    setHasSelectedFilter(true);
    setIsFiltering(true);

    try {
      filterGames(item.id); // ✅ use id, not value
      setSelectedGame(null);
    } finally {
      setIsFiltering(false);
    }
  };

  // Opponent and Opening Logic
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
        const ecoUrlMatch = game.pgn.match(/\[ECOUrl\s+"([^"]+)"\]/);
        if (ecoUrlMatch?.[1]) {
          const ecoUrl = decodeURIComponent(ecoUrlMatch[1]);
          let openingName = ecoUrl.split("/").pop().replace(/_/g, " ");

          openingName = openingName
            .replace(/\d+\.{1,3}[a-z]?(\.\.\.)?.*\s*$/i, "")
            .split(":")[0]
            .split("(")[0]
            .trim();

          const normOpening = normalize(openingName);

          const matchedMain = openingsData.reduce((best, main) => {
            const normMain = normalize(main);
            const mainWords = normMain.split(" ");
            const matchedWords = mainWords.filter((word) =>
              normOpening.includes(word)
            );
            const score = matchedWords.length / mainWords.length;

            if (
              !best ||
              score > best.score ||
              (score === best.score && normMain.length > best.normMainLength)
            ) {
              return { value: main, score, normMainLength: normMain.length };
            }
            return best;
          }, null);

          const finalOpening = matchedMain?.value || openingName;
          openings[finalOpening] = (openings[finalOpening] || 0) + 1;
        }
      } catch (err) {
        console.error("Error extracting opening from PGN:", err);
      }
    }

    const opponentItems = Object.entries(opponents)
      .map(([name, count], i) => ({
        id: `opponent-${i}`, // ✅ unique id
        type: "opponent",
        value: name,
        count,
      }))
      .sort((a, b) => b.count - a.count);

    const openingItems = Object.entries(openings)
      .map(([name, count], i) => ({
        id: `opening-${i}`, // ✅ unique id
        type: "opening",
        value: name,
        count,
      }))
      .sort((a, b) => b.count - a.count);

    const allItems = [...opponentItems, ...openingItems];
    setAllDropdownList(allItems); // Store the full list for future reference
    // setOpponentList(allItems);
    setDropdownList(allItems);
  };

  useEffect(() => {
    generateOpponentOpeningList(displayedGames);
  }, [displayedGames]);

  return (
    <div className="bg-[#0D0D0D] poppins">
      {!profile && !loading ? (
        <Login
          username={username}
          setUsername={setUsername}
          handleSubmit={handleSubmit}
          error={error}
        />
      ) : (
        <>
          {loading ? (
            <div className="h-[100vh] scale-[0.3] flex justify-center items-center">
              <KnightBoard />
            </div>
          ) : (
            <>
              <Navbar
                profile={profile}
                username={username}
                setUsername={setUsername}
              />

              <main className="max-w-7xl mx-auto px- py-6 px-5">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1">
                    <div className="py-4 w-full">
                      <div className="flex flex-col space-y-2 relative quicksand">
                        <form className="relative lg:w-full max-lg:w-[446px] sm:w-[446px] mx-auto">
                          <input
                            type="text"
                            placeholder="Search opponents or openings..."
                            value={searchQuery}
                            onChange={(e) => handleSearchQueryChange(e)}
                            onFocus={() => setShowDropdown(true)}
                            onBlur={() =>
                              setTimeout(() => setShowDropdown(false), 150)
                            }
                            className="w-full px-4 py-2 border border-transparent rounded-lg outline-none bg-[#1A1A1A] text-white focus:border-[#5ED3F3] lg:w-full max-lg:w-[446px] sm:w-[446px]"
                          />
                          {/* blocking filter logic for now */}
                          {/* <select
                            value={filterMode}
                            onChange={(e) => {
                              setFilterMode(e.target.value)
                              handleSearchQueryChange({ target: { value: searchQuery } });
                            }}
                            className="border rounded px-2 py-1 text-white"
                          >
                            <option value="both">Both</option>
                            <option value="opponents">Opponents</option>
                            <option value="openings">Openings</option>
                          </select> */}
                          {searchQuery && (
                            <button
                              onClick={() => setSearchQuery("")}
                              className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                            >
                              <RxCross2 size={20} />
                            </button>
                          )}
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
                        <h2 className="text-xl font-semibold mb-4 syne">
                          Games with Selected Opening/Opponent
                        </h2>
                        {isFiltering ? (
                          <p className="text-gray-500 italic">
                            Loading games...
                          </p>
                        ) : filteredGames.length === 0 ? (
                          <p className="text-gray-500">No games found.</p>
                        ) : (
                          <>
                            <ul className="space-y-2">
                              {filteredGames
                                .slice(
                                  (currentFilteredPage - 1) * gamesPerPage,
                                  currentFilteredPage * gamesPerPage
                                )
                                .map((game, index) => (
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
                                    <div className="flex items-center gap-2">
                                      {getGameOutcome(game, username)}{" "}
                                      <RxCaretRight />
                                    </div>
                                  </li>
                                ))}
                            </ul>
                            <div className="flex justify-center gap-3 mt-4 items-center">
                              <button
                                onClick={() =>
                                  setCurrentFilteredPage((p) =>
                                    Math.max(p - 1, 1)
                                  )
                                }
                                disabled={currentFilteredPage === 1}
                                className="px-3 py-1 bg-[#222] rounded disabled:opacity-50 cursor-pointer"
                              >
                                Prev
                              </button>
                              <span className="text-white">
                                {currentFilteredPage} /{" "}
                                {Math.ceil(filteredGames.length / gamesPerPage)}
                              </span>
                              <button
                                onClick={() =>
                                  setCurrentFilteredPage((p) =>
                                    p <
                                    Math.ceil(
                                      filteredGames.length / gamesPerPage
                                    )
                                      ? p + 1
                                      : p
                                  )
                                }
                                disabled={
                                  currentFilteredPage ===
                                  Math.ceil(filteredGames.length / gamesPerPage)
                                }
                                className="px-3 py-1 bg-[#222] rounded disabled:opacity-50 cursor-pointer"
                              >
                                Next
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="lg:col-span-2 pt-5">
                    <div className="flex justify-between max-md:flex-col">
                      {/* Month Selector */}
                      {selectedYear && (
                        <div className="flex gap-3 w-[70%] flex-wrap max-md:w-full syne px-2">
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
                                className={`px-3 w-[50px] py-1 rounded transition-colors ${
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
                        className="relative max-md:pt-2 max-md:ml-auto max-md:p-5"
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
