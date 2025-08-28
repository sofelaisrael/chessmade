import React, { useState, useEffect, useRef } from "react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import Filter from "./UI/gamelist/Filter";
import FilterItem from "./UI/gamelist/FilterItem";
import Pagination from "./UI/gamelist/Pagination";

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
        <Filter
          ref={resultRef}
          title="Result"
          setShowDropdown={setShowResultDropdown}
          filters={filters}
          setFilters={setFilters}
          items={["all", "win", "loss", "draw"]}
          showDropdown={showResultDropdown}
        />

        {/* Color Filter */}
        <Filter
          ref={colorRef}
          title="Color"
          setShowDropdown={setShowColorDropdown}
          filters={filters}
          setFilters={setFilters}
          items={["all", "white", "black"]}
          showDropdown={showColorDropdown}
        />
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
                <FilterItem
                  k={game.url}
                  playerColor={playerColor}
                  game={game}
                  onSelectGame={onSelectGame}
                />
              );
            })
          )}
        </ul>
      </div>

      {statsFilteredGames.length > gamesPerPage && (
        <Pagination
          currentPage={currentPage}
          handleNextPage={handleNextPage}
          handlePreviousPage={handlePreviousPage}
          statsFilteredGames={statsFilteredGames}
          gamesPerPage={gamesPerPage}
        />
      )}
    </div>
  );
};

export default GamesLists;