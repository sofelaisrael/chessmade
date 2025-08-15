import React, { useState, useEffect, useRef } from "react";
import { RxCaretDown } from "react-icons/rx";
import { MdNavigateBefore, MdNavigateNext } from "react-icons/md";
import { TiEquals } from "react-icons/ti";
import { BiPlus, BiMinus } from "react-icons/bi";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const GamesLists = ({
  username = "",
  games,
  onSelectGame,
  loading,
  setLoading,
}) => {
  const [statsFilteredGames, setStatsFilteredGames] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const gamesPerPage = 6;
  const [filters, setFilters] = useState({ result: "all", color: "all" });
  const [showResultDropdown, setShowResultDropdown] = useState(false);
  const [showColorDropdown, setShowColorDropdown] = useState(false);
  const resultRef = useRef(null);
  const colorRef = useRef(null);

  useEffect(() => {
    setStatsFilteredGames(games.reverse());
    const handleClickOutside = (e) => {
      if (resultRef.current && !resultRef.current.contains(e.target)) {
        setShowResultDropdown(false);
      }
      if (colorRef.current && !colorRef.current.contains(e.target)) {
        setShowColorDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    let filtered = games;
    setLoading(false);
    if (filters.result !== "all") {
      filtered = filtered.filter((game) => {
        const playerColor =
          game.white.username.toLowerCase() === username.toLowerCase()
            ? "white"
            : "black";
        if (filters.result === "win") {
          return (
            (playerColor === "white" && game.white.result === "win") ||
            (playerColor === "black" && game.black.result === "win")
          );
        }
        if (filters.result === "loss") {
          return (
            (playerColor === "white" && game.black.result === "win") ||
            (playerColor === "black" && game.white.result === "win")
          );
        }
        if (filters.result === "draw") {
          return [
            "insufficient",
            "repetition",
            "agreed",
            "50move",
            "stalemate",
            "timevsinsufficient",
            "timeoutvsinsufficient",
          ].includes(game.white.result);
        }
        return true;
      });
    }

    if (filters.color !== "all") {
      filtered = filtered.filter((game) => {
        const playerColor =
          game.white.username.toLowerCase() === username.toLowerCase()
            ? "white"
            : "black";
        return playerColor === filters.color;
      });
    }

    setStatsFilteredGames(filtered);
    setCurrentPage(1);
  }, [games, filters]);

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({ ...prev, [filterName]: value }));
  };

  const handleNextPage = () => {
    if (currentPage < Math.ceil(statsFilteredGames.length / gamesPerPage)) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const currentGames = statsFilteredGames
    .sort((a, b) => b.end_time - a.end_time)
    .slice((currentPage - 1) * gamesPerPage, currentPage * gamesPerPage);

  return (
    <div>
      <div className="flex space-x-4 items-center my-4 max-md:gap-3 relative max-md:flex-col max-md:items-start max-md:px-2">
        {/* Result Filter */}
        <div className="res flex items-center gap-5">
          <span className="text-white font-bold syne w-[80px]">Results:</span>
          <div className="relative" ref={resultRef}>
            <button
              onClick={() => setShowResultDropdown(!showResultDropdown)}
              className="p-2 border rounded text-white bg-[#1e1e1e] w-32 text-left flex items-center justify-between border-[#777]"
            >
              {filters.result.charAt(0).toUpperCase() + filters.result.slice(1)}
              <RxCaretDown />
            </button>
            {showResultDropdown && (
              <ul className="absolute z-10 mt-1 bg-[#1e1e1e] border rounded w-32 text-white border-[#777]">
                {["all", "win", "loss", "draw"].map((option) => (
                  <li
                    key={option}
                    className="px-4 py-2 hover:bg-[#333] cursor-pointer"
                    onClick={() => {
                      handleFilterChange("result", option);
                      setShowResultDropdown(false);
                    }}
                  >
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Color Filter */}
        <div className="col flex items-center gap-5">
          <span className="text-white font-bold syne w-[80px]">Colors:</span>
          <div className="relative" ref={colorRef}>
            <button
              onClick={() => setShowColorDropdown(!showColorDropdown)}
              className="p-2 border rounded text-white bg-[#1e1e1e] w-32 text-left flex justify-between items-center border-[#777]"
            >
              {filters.color.charAt(0).toUpperCase() + filters.color.slice(1)}
              <RxCaretDown />
            </button>
            {showColorDropdown && (
              <ul className="absolute z-10 mt-1 bg-[#1e1e1e] border rounded w-32 text-white border-[#777]">
                {["all", "white", "black"].map((option) => (
                  <li
                    key={option}
                    className="px-4 py-2 hover:bg-[#333] cursor-pointer"
                    onClick={() => {
                      handleFilterChange("color", option);
                      setShowColorDropdown(false);
                    }}
                  >
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="h-full">
        <ul className="flex flex-wrap gap-4">
          {loading ? (
            Array.from({ length: 6 }).map((_, idx) => (
              <SkeletonTheme
                baseColor="#2a2a2a"
                highlightColor="#444"
                key={idx}
              >
                <li className="skeleton overflow-hidden h-full rounded-lg w-[250px] max-md:w-full">
                  <Skeleton height={110} />
                </li>
              </SkeletonTheme>
            ))
          ) : currentGames.length === 0 ? (
            <div className="text-white text-sm italic opacity-70 h-[300px]">
              No games found with this filter.
            </div>
          ) : (
            currentGames.map((game) => {
              const playerColor =
                game.white.username.toLowerCase() === username.toLowerCase()
                  ? "white"
                  : "black";
              return (
                <li
                  key={game.url}
                  onClick={() => onSelectGame(game)}
                  className="border rounded-lg p-4 text-white border-[#494949] cursor-pointer bg-[#1e1e1e] hover:bg-[#1a1a1a] w-[250px] max-md:w-full flex- max-xl:w-[200px] max-lg:w-[250px] "
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between">
                      <div className="text-sm font-medium flex items-center gap-1 truncate w-[80%]">
                        vs.{" "}
                        <div
                          className={`size-3 shrink-0 rounded-full border ${
                            playerColor === "black"
                              ? "bg-white border-black"
                              : "border-white bg-black"
                          }`}
                        ></div>
                        <div className="truncate">
                          {playerColor === "white"
                            ? game.black.username
                            : game.white.username}
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 shrink-0">
                        {new Date(game.end_time * 1000).toLocaleDateString(
                          "en-GB",
                          { day: "2-digit", weekday: "short" }
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">
                        {game.time_class.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-400">
                        {game.rated ? "Rated" : "Unrated"}
                      </span>
                    </div>

                    <div className="flex justify-between mt-2">
                      {playerColor === "white" ? (
                        game.white.result === "win" ? (
                          <BiPlus className="text-green-500" />
                        ) : game.black.result === "win" ? (
                          <BiMinus className="text-red-500" />
                        ) : (
                          <TiEquals className="text-gray-400" />
                        )
                      ) : game.black.result === "win" ? (
                        <BiPlus className="text-green-500" />
                      ) : game.white.result === "win" ? (
                        <BiMinus className="text-red-500" />
                      ) : (
                        <TiEquals className="text-gray-400" />
                      )}

                      <span className="text-gray-400 text-xs">
                        {playerColor === "black"
                          ? game.black.rating
                          : game.white.rating}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </div>

      {statsFilteredGames.length > gamesPerPage && (
        <div className="flex mt-4 text-white items-center gap-2 quicksand">
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className="p-2 border border-[#777] rounded-full disabled:opacity-50"
          >
            <MdNavigateBefore />
          </button>
          <span className="rounded-[100px] px-3 h-[40px] flex items-center justify-center">
            {currentPage} /{" "}
            {Math.ceil(statsFilteredGames.length / gamesPerPage)}
          </span>
          <button
            onClick={handleNextPage}
            disabled={
              currentPage ===
              Math.ceil(statsFilteredGames.length / gamesPerPage)
            }
            className="p-2 border border-[#777] rounded-full disabled:opacity-50"
          >
            <MdNavigateNext />
          </button>
        </div>
      )}
    </div>
  );
};

export default GamesLists;
