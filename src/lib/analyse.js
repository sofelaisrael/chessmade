// lib/analyse.js
import { Chess } from "chess.js";

export default function analyse(positions) {
  let lastBest;
  const analysed = positions.map((p, i) => {
    if (i === 0) return { ...p, classification: "book" };

    let classification = "book";
    let evalDiff = 0;

    if (p.topLines && p.topLines.length > 0) {
      // Use engine data if available
      const bestEval = p.topLines[0].cp ?? (p.topLines[0].mate ? 1000 : 0);
      const prevEval = lastBest ?? bestEval;
      evalDiff = bestEval - prevEval;
      classification = classify(evalDiff);
      lastBest = bestEval;
    } else {
      // Fallback if no engine data
      classification = "book";
    }

    return { ...p, classification, evalDiff };
  });

  return {
    positions: analysed,
    accuracies: calculateAccuracies(analysed),
  };
}

function classify(evalDiff) {
  const absDiff = Math.abs(evalDiff);
  if (absDiff < 30) return "best";
  if (absDiff < 60) return "excellent";
  if (absDiff < 100) return "good";
  if (evalDiff > 0) return "inaccuracy";
  if (evalDiff < -100) return "mistake";
  if (evalDiff < -300) return "blunder";
  return "ok";
}

function calculateAccuracies(positions) {
  const scores = { white: 100, black: 100 };

  positions.forEach((p, i) => {
    if (i === 0 || !p.move) return;
    const player = i % 2 === 1 ? "white" : "black";
    switch (p.classification) {
      case "mistake":
        scores[player] -= 5;
        break;
      case "blunder":
        scores[player] -= 10;
        break;
      case "inaccuracy":
        scores[player] -= 2;
        break;
      default:
        break;
    }
  });

  return scores;
}
