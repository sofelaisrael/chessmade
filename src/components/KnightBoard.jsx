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

const KnightBoard = () => {
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
    }, 800);

    return () => clearInterval(interval);
  }, [position, prevPosition]);

  const cellSize = 64;
  const [x, y] = position;

  return (
    <div
      className="relative"
      style={{ width: cellSize * 3, height: cellSize * 3 }}
    >
      {/* 3x3 board grid */}
      {Array.from({ length: 3 }).map((_, row) =>
        Array.from({ length: 3 }).map((_, col) => (
          <div
            key={`${row}-${col}`}
            style={{
              position: "absolute",
              width: cellSize,
              height: cellSize,
              left: col * cellSize,
              top: row * cellSize,
              backgroundColor: (row + col) % 2 === 0 ? "#1f2937" : "#4b5563",
            }}
          />
        ))
      )}

      <div
        className="absolute bg-white rounded shadow-md transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]"
        style={{
          width: cellSize * 0.8,
          height: cellSize * 0.8,
          left: y * cellSize + cellSize * 0.1,
          top: x * cellSize + cellSize * 0.1,
        }}
      />
    </div>
  );
};

export default KnightBoard;
