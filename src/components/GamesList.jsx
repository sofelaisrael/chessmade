import { RxCaretDown } from "react-icons/rx";
import { MdNavigateBefore, MdNavigateNext } from "react-icons/md";
import { TiEquals } from "react-icons/ti";
import { BiPlus, BiMinus } from "react-icons/bi";
import React, { useState, useEffect, useRef } from "react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { getMonthlyGames } from "../lib/chesscom";

import { format } from "date-fns";

const GamesList = ({
  username = "",
  onSelectGame,
  archives,
  setSelectedYear,
  selectedYear,
}) => {
  const [selectedMonth, setSelectedMonth] = useState(() => new Date());
  const [monthGames, setMonthGames] = useState([]);
  const [statsFilteredGames, setStatsFilteredGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const gamesPerPage = 6;
  const [filters, setFilters] = useState({ result: "all", color: "all" });
  const [showResultDropdown, setShowResultDropdown] = useState(false);
  const [showColorDropdown, setShowColorDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);

  const resultRef = useRef(null);
  const colorRef = useRef(null);
  const yearRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (resultRef.current && !resultRef.current.contains(e.target)) {
        setShowResultDropdown(false);
      }
      if (colorRef.current && !colorRef.current.contains(e.target)) {
        setShowColorDropdown(false);
      }
      if (yearRef.current && !yearRef.current.contains(e.target)) {
        setShowYearDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (archives[selectedYear]?.length > 0) {
      const sortedMonths = [...archives[selectedYear]].sort((a, b) => b - a);
      const latestMonth = parseInt(sortedMonths[0]);
      const defaultDate = new Date(parseInt(selectedYear), latestMonth - 1);
      setSelectedMonth(defaultDate);
    }
  }, [selectedYear]);

  useEffect(() => {
    const loadGames = async () => {
      if (!selectedMonth || !selectedYear || !username) return;

      setLoading(true);
      const games = await getMonthlyGames(
        username,
        parseInt(selectedYear),
        selectedMonth.getMonth() + 1
      );
      const standardGames = games.filter((game) => game.rules === "chess");

      setMonthGames(standardGames.reverse());
      setLoading(false);
      setCurrentPage(1);
    };

    loadGames();
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    let filtered = monthGames;

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
  }, [monthGames, filters]);

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

  const currentGames = statsFilteredGames.slice(
    (currentPage - 1) * gamesPerPage,
    currentPage * gamesPerPage
  );

  const formatTimeControl = (timeControl) => {
    const [initial, increment] = timeControl.split("+").map(Number);
    return `${initial / 60} min${increment ? ` + ${increment}s` : ""}`;
  };

  return (
    <div>
      <div className="flex justify-between max-md:flex-col">
        <div className="flex gap-3 w-[70%] flex-wrap max-md:w-full max-md:gap-x-1 max-md:justify-evenly">
          {Array.from({ length: 12 }).map((_, i) => {
            const monthName = new Date(0, i).toLocaleString("default", {
              month: "short",
            });
            const monthStr = String(i + 1).padStart(2, "0");
            const isAvailable = archives[selectedYear]?.includes(monthStr);

            return (
              <button
                key={i}
                className={`rounded text-sm w-[50px] h-[30px] ${
                  isAvailable
                    ? "bg-[#1e1e1e] text-white hover:bg-[#fff] hover:text-[#1e1e1e]"
                    : "bg-gray-200 opacity-25 text-gray-400"
                } ${
                  selectedMonth?.getMonth() === i
                    ? "bg-[#373D49] border border-[#777]"
                    : ""
                }`}
                disabled={!isAvailable}
                onClick={() =>
                  setSelectedMonth(new Date(parseInt(selectedYear), i))
                }
              >
                {monthName}
              </button>
            );
          })}
        </div>

        {/* Year Dropdown */}
        <div className="relative max-md:pt-2 max-md:ml-auto" ref={yearRef}>
          <button
            onClick={() => setShowYearDropdown(!showYearDropdown)}
            className="p-2 border rounded text-white bg-[#1e1e1e] w-24 flex items-center justify-between border-[#777]"
          >
            {selectedYear}
            <RxCaretDown />
          </button>
          {showYearDropdown && (
            <ul className="absolute z-10 mt-1 bg-[#1e1e1e] border rounded w-24 text-white border-[#777]">
              {Object.keys(archives)
                .sort((a, b) => b - a)
                .map((y) => (
                  <li
                    key={y}
                    className="px-4 py-2 hover:bg-[#333] cursor-pointer"
                    onClick={() => {
                      setSelectedYear(y);
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

      <div className="flex space-x-4 items-center my-4 max-md:gap-3 relative max-md:flex-col max-md:items-start">
        {/* Result Filter */}
        <div className="res flex items-center gap-5">
          <span className="text-white font-bold">Results:</span>
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
          <span className="text-white font-bold">Colors:</span>
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

      <div>
        <ul className="flex flex-wrap gap-4">
          {loading
            ? Array.from({ length: 6 }).map((_, idx) => (
                <SkeletonTheme
                  baseColor="#2a2a2a"
                  highlightColor="#444"
                  key={idx}
                >
                  <li className="border rounded-lg w-[250px] max-md:w-full">
                    <Skeleton containerClassName="skeleton" height={110} />
                  </li>
                </SkeletonTheme>
              ))
            : currentGames.map((game) => {
                const playerColor =
                  game.white.username.toLowerCase() === username.toLowerCase()
                    ? "white"
                    : "black";

                return (
                  <li
                    key={game.url}
                    onClick={() => onSelectGame(game)}
                    className="border rounded-lg p-4 text-white border-[#494949] cursor-pointer bg-[#1e1e1e] hover:bg-[#1a1a1a] w-[250px] max-md:w-full"
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between">
                        <div className="text-sm font-medium flex items-center gap-1 truncate w-[80%]">
                          vs.{" "}
                          <div
                            className={`size-3 shrink-0 rounded-full border bg-${
                              playerColor === "black"
                                ? "white border-black"
                                : "border-white black"
                            }`}
                          ></div>
                          <div className="truncate">
                            {playerColor === "white"
                              ? game.black.username
                              : game.white.username}
                          </div>
                        </div>
                        <span className="text-xs text-gray-400 shrink-0">
                          {formatTimeControl(game.time_control)}
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
              })}
        </ul>
      </div>

      {statsFilteredGames.length > gamesPerPage && (
        <div className="flex mt-4 text-white items-center gap-5">
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className="p-2 border border-[#777] rounded disabled:opacity-50"
          >
            <MdNavigateBefore />
          </button>
          <span>
            {currentPage} /{" "}
            {Math.ceil(statsFilteredGames.length / gamesPerPage)}
          </span>
          <button
            onClick={handleNextPage}
            disabled={
              currentPage ===
              Math.ceil(statsFilteredGames.length / gamesPerPage)
            }
            className="p-2 border border-[#777] rounded disabled:opacity-50"
          >
            <MdNavigateNext />
          </button>
        </div>
      )}
    </div>
  );
};

export default GamesList;
