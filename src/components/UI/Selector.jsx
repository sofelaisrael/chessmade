import React from "react";
import { getMonthlyGames } from "../../lib/chesscom";
import { RxCaretDown } from "react-icons/rx";

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
const Selector = ({
  selectedYear,
  setSelectedYear,
    yearRef,
  showYearDropdown,
  setShowYearDropdown,
  archiveMap,
  selectedMonth,
  monthlyGames,
  setMonthlyGames,
  setSelectedMonth,
  setDisplayedGames,
  setLoadedGames,
  username,
}) => {
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

  return (
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
                onClick={() => isAvailable && handleMonthClick(i)}
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
  );
};

export default Selector;
