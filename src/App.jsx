import { RxCaretRight } from "react-icons/rx";
import { MdKeyboardArrowRight } from "react-icons/md";
import { BiUser } from "react-icons/bi";
import { FaChessPawn } from "react-icons/fa";
import { CgUser } from "react-icons/cg";
import { AiOutlineSearch } from "react-icons/ai";
import React, { useState, useEffect } from "react";
import ChessBoard from "./components/ChessBoard";
import GamesList from "./components/GamesList";
import "./App.css";
import defaultimg from "./assets/default.png";
import { getMonthlyGames } from "./lib/chesscom";
import ecoA from "./data/ecoA.json";
import ecoB from "./data/ecoB.json";
import ecoC from "./data/ecoC.json";
import ecoD from "./data/ecoD.json";
import ecoE from "./data/ecoE.json";
import { Chess } from "chess.js";


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

function App() {
  const [username, setUsername] = useState("");
  const [profile, setProfile] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);
  const [allGames, setAllGames] = useState([]);
  const [filteredGames, setFilteredGames] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [opponentList, setOpponentList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hasSelectedFilter, setHasSelectedFilter] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [archives, setArchives] = useState({});
  const [year, setYear] = useState(null);



  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setProgress(0);
    setHasSelectedFilter(false);

    try {
      const res = await fetch(`https://api.chess.com/pub/player/${username}`);
      const data = await res.json();
      setProfile(data);

      if (data.joined) {
        const joinedDate = new Date(data.joined * 1000);

        const currentDate = new Date();
        const games = [];
        const totalMonths =
          (currentDate.getFullYear() - joinedDate.getFullYear()) * 12 +
          (currentDate.getMonth() - joinedDate.getMonth() + 1);
        let completedMonths = 0;

        for (
          let year = joinedDate.getFullYear();
          year <= currentDate.getFullYear();
          year++
        ) {
          const startMonth =
            year === joinedDate.getFullYear() ? joinedDate.getMonth() + 1 : 1;
          const endMonth =
            year === currentDate.getFullYear()
              ? currentDate.getMonth() + 1
              : 12;

          for (let month = startMonth; month <= endMonth; month++) {
            const monthlyGames = await getMonthlyGames(username, year, month);
            games.push(...monthlyGames);

            completedMonths++;
            setProgress(Math.round((completedMonths / totalMonths) * 100));
          }
        }

        setAllGames(games);
        setFilteredGames(games);
      }
    } catch (err) {
      console.error("Error fetching profile/games:", err);
    } finally {
      setLoading(false);
    }
  };

  
  useEffect(() => {
    if (profile && allGames.length > 0) {
      setTimeout(() => {
        const list = generateOpponentOpeningList(allGames);
        setOpponentList(list);
      }, 100);
    }
  }, [profile, allGames]);

  const generateOpponentOpeningList = (games) => {
    const opponentMap = new Map();
    const openingMapCount = new Map();

    for (const game of games) {
      const opponent =
        game.white.username.toLowerCase() === username.toLowerCase()
          ? game.black.username
          : game.white.username;

      if (opponent) {
        opponentMap.set(opponent, (opponentMap.get(opponent) || 0) + 1);
      }

      try {
        const chess = new Chess();
        chess.loadPgn(game.pgn);
        const headers = chess.header();
        const eco = headers["ECO"] || null;
        const moves = chess.history().join(" ");
        const openingName = getOpeningNameFromMoves(moves, eco);

        if (openingName) {
          openingMapCount.set(
            openingName,
            (openingMapCount.get(openingName) || 0) + 1
          );
        }
      } catch (err) {
        continue;
      }
    }

    const opponentList = Array.from(opponentMap.entries()).map(
      ([value, count]) => ({ type: "opponent", value, count })
    );

    const openingList = Array.from(openingMapCount.entries()).map(
      ([value, count]) => ({ type: "opening", value, count })
    );

    return [...opponentList, ...openingList];
  };

  const getOpeningNameFromMoves = (moves, ecoCode = null) => {
    const normalized = normalizeMoves(moves);

    
    if (ecoCode) {
      const candidates = Object.values(combinedOpenings).filter(
        (o) => o.eco === ecoCode
      );

      for (const opening of candidates) {
        const openingMoves = normalizeMoves(opening.moves);
        if (normalized.startsWith(openingMoves)) {
          return opening.name.split(/[:|,]/)[0].trim(); 
        }
      }
    }

    
    for (const [name, moveList] of openingMap.entries()) {
      for (const sequence of moveList) {
        if (normalized.startsWith(sequence)) {
          return name;
        }
      }
    }

    return null;
  };

  const handleSearchQueryChange = (e) => {
    setSearchQuery(e.target.value);
  };


  const handleDropdownSelect = async (item) => {
    setSearchQuery(item.value);
    setHasSelectedFilter(true);
    setIsFiltering(true); 

    try {
      if (item.type === "opponent") {
        const filtered = allGames.filter((game) => {
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
        const filtered = allGames.filter((game) => {
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
      }
    } finally {
      setIsFiltering(false);
    }
  };

  useEffect(() => {
    const fetchArchives = async () => {
      try {
        const res = await fetch(
          `https://api.chess.com/pub/player/${username}/games/archives`
        );
        const data = await res.json();

        const map = {};

        data.archives.forEach((url) => {
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

        setArchives(map);
        if (sortedYears.length > 0) {
          setYear(sortedYears[0]);
        }
      } catch (error) {
        console.error("Failed to fetch archives:", error);
      }
    };

    if (username) {
      fetchArchives();
    }
  }, [profile?.username]);

  return (
    <div className="min-h-screen bg-[#0D0D0D]">
      {profile && (
        <header className="shadow-md flex justify-between px-10 py-5 items-center max-md:px-5 gap-5 relative">
          <div className="flex gap-10 justify-between items-center h-full">
            <div className="text-3xl font-bold text-[#fff] max-lg:text-xl max-md:text-lg">
              ChessMade
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
      )}

      {/* MAIN */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {!profile && !loading ? (
          <div className="flex flex-col items-center h-[80vh] px-10 max-md:px-5 justify-center space-y-6">
            <h2 className="text-2xl font-semibold text-white text-center">
              Enter your Chess.com username
            </h2>
            <form onSubmit={handleUserSubmit} className="w-full max-w-md">
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
        ) : loading ? (
          <div className="flex flex-col items-center h-[60vh] justify-center">
            <h2 className="text-xl font-semibold text-white text-center">
              Fetching games for {username}...
            </h2>
            <div className="w-full max-w-md bg-white rounded-full h-4 mt-4">
              <div
                className="bg-b[#5ed3f3] h-4 rounded-full"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-white mt-2">{progress}% completed</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="py-4 w-full">
                <div className="flex flex-col space-y-2 relative">
                  <form onSubmit={(e) =>  e.preventDefault()} className="relative">
                    <input
                      type="text"
                      placeholder="Search opponents or openings..."
                      value={searchQuery}
                      onChange={handleSearchQueryChange}
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
                  {showDropdown && opponentList.length > 0 && searchQuery && (
                    <ul className="rounded shadow-md max-h-40 overflow-y-auto abste bottom-0">
                      {opponentList
                        .filter((item) =>
                          item.value
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase())
                        )
                        .map((item, index) => (
                          <li
                            key={index}
                            className="px-4 py-2 hover:bg-[#171D27] text-white cursor-pointer flex justify-between go  mr-2 rounded"
                            onClick={() => handleDropdownSelect(item)}
                          >
                            <span>
                              <span className="text-sm gap-2 flex items-center ">
                                {item.type === "opponent" ? (
                                  <CgUser />
                                ) : (
                                  <FaChessPawn />
                                )}
                                {item.value}
                              </span>
                            </span>
                            <span className="text-sm font-bold">
                              {item.count}
                              {/* [{item.type}] */}
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
                username={profile.username}
                whiteresult={selectedGame?.white.result}
                blackresult={selectedGame?.black.result}
              />

              {hasSelectedFilter && (
                <div className="bg-[#1e1e1e] text-white shadow-md rounded-lg p-4 mt-4">
                  <h2 className="text-xl font-semibold mb-4">
                    Games with Selected Opening/Opponent
                  </h2>
                  {isFiltering ? (
                    <p className="text-gray-500 italic">Loading games...</p>
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
                            {game.white.username.toLocaleLowerCase() ===
                            username.toLocaleLowerCase()
                              ? game.white.result
                              : game.black.result}
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
              <GamesList
                username={username}
                fullgames={allGames}
                onSelectGame={setSelectedGame}
                archives={archives}
                selectedYear={year}
                setSelectedYear={setYear}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
