import React, { useEffect, useState } from "react";

const knightMoves = [
  [2, 1],
  [1, 2],
  [-1, 2],
  [-2, 1],
  [-2, -1],
  [-1, -2],
  [1, -2],
  [2, -1],
];

const isValid = (x, y) => x >= 0 && x < 3 && y >= 0 && y < 3;

const KnightBoard3x3 = () => {
  const [position, setPosition] = useState([0, 0]);
  const [prevPosition, setPrevPosition] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const [x, y] = position;

      const validMoves = knightMoves
        .map(([dx, dy]) => [x + dx, y + dy])
        .filter(([nx, ny]) => isValid(nx, ny));

      const filtered = validMoves.filter(
        (pos) => !prevPosition || pos[0] !== prevPosition[0] || pos[1] !== prevPosition[1]
      );

      const next =
        filtered.length > 0
          ? filtered[Math.floor(Math.random() * filtered.length)]
          : validMoves[Math.floor(Math.random() * validMoves.length)];

      setPrevPosition(position);
      setPosition(next);
    }, 500);

    return () => clearInterval(interval);
  }, [position, prevPosition]);

  return (
    <div className="grid grid-cols-3 gap-1 w-48 h-48">
      {Array.from({ length: 3 }).map((_, row) =>
        Array.from({ length: 3 }).map((_, col) => {
          const isKnight = position[0] === row && position[1] === col;
          return (
            <div
              key={`${row}-${col}`}
              className={`w-full h-full transition-all duration-300 ${
                (row + col) % 2 === 0 ? "bg-gray-800" : "bg-gray-600"
              } ${isKnight ? "scale-105 knight" : ""}`}
            ></div>
          );
        })
      )}
    </div>
  );
};

export default KnightBoard3x3;
