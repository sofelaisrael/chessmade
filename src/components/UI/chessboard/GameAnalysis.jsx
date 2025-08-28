import React, { useEffect, useState } from "react";
import { Chess } from "chess.js";
import analyse from "../../../lib/analyse";

export default function GameAnalysis({ pgn }) {
  const [report, setReport] = useState(null);

  useEffect(() => {
    if (!pgn) return;

    const chess = new Chess();
    chess.loadPgn(pgn);

    // Build dummy positions array for analyse()
    const positions = [];
    chess.reset();
    positions.push({ fen: chess.fen(), topLines: [], move: null });

    chess.history({ verbose: true }).forEach(move => {
      chess.move(move.san);
      positions.push({
        fen: chess.fen(),
        move: { uci: move.from + move.to + (move.promotion || ""), san: move.san },
        topLines: [] // empty for now (no engine evals)
      });
    });

    const r = analyse(positions);
    setReport(r);
  }, [pgn]);

  if (!report) return <div className="p-4">Select a game to analyse...</div>;

  return (
    <div className="p-4 space-y-2">
      <h2 className="text-xl font-bold">Game Analysis</h2>
      <p>Accuracy (White): {report.accuracies.white.toFixed(1)}%</p>
      <p>Accuracy (Black): {report.accuracies.black.toFixed(1)}%</p>

      <h3 className="font-semibold">Moves:</h3>
      <ul className="space-y-1">
        {report.positions.map((p, i) => (
          <li key={i}>
            {p.move
              ? `${i}. ${p.move.san} → ${p.classification ?? "book"}`
              : "Start position"}
          </li>
        ))}
      </ul>
    </div>
  );
}
