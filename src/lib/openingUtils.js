import { Chess } from "chess.js";

// --- Clean opening name (remove variations only, not "Defense"/"Opening") ---
export const normalizeOpening = (name) => {
  if (!name) return "";

  return name
    .split(":")[0] // cut off after ":" → removes variation info
    .split("(")[0] // cut off after "(" → removes sub-lines
    .replace(/\s+/g, " ") // normalize spaces
    .trim();
};

// --- Get opponent username safely ---
export const getOpponent = (game, username) => {
  return game.white.username.toLowerCase() === username.toLowerCase()
    ? game.black.username
    : game.white.username;
};

// --- Extract opening using ECOUrl mapping ---
export const getOpeningFromGame = (game, openingsData) => {
  try {
    const chess = new Chess();
    chess.loadPgn(game.pgn);

    const headers = chess.header();
    const ecoUrl = headers["ECOUrl"];

    // Use ECOUrl as key → fall back to PGN "Opening" if missing
    const rawName = (ecoUrl && openingsData[ecoUrl]) || headers["Opening"] || "";

    return normalizeOpening(rawName);
  } catch {
    return "";
  }
};

// --- Filter games by opponent or opening ---
export const filterGamesByQuery = (games, query, username, openingsData) => {
  const q = query.toLowerCase();

  return games.filter((game) => {
    // opponent match
    const opponent = getOpponent(game, username);
    if (opponent.toLowerCase().includes(q)) return true;

    // opening match
    const opening = getOpeningFromGame(game, openingsData).toLowerCase();
    return opening.includes(q);
  });
};

// --- Build opponent-opening list for sidebar stats ---
export const generateOpponentOpeningList = (games, username, openingsData) => {
  const opponentOpeningMap = {};

  games.forEach((game) => {
    const opponent = getOpponent(game, username);
    const opening = getOpeningFromGame(game, openingsData);

    if (!opponentOpeningMap[opponent]) {
      opponentOpeningMap[opponent] = {};
    }

    if (!opponentOpeningMap[opponent][opening]) {
      opponentOpeningMap[opponent][opening] = 0;
    }

    opponentOpeningMap[opponent][opening] += 1;
  });

  // ✅ Convert to flat array for dropdown
  const dropdownList = [];

  Object.keys(opponentOpeningMap).forEach((opponent) => {
    dropdownList.push({
      type: "opponent",
      value: opponent,
      count: Object.values(opponentOpeningMap[opponent]).reduce((a, b) => a + b, 0),
    });

    Object.keys(opponentOpeningMap[opponent]).forEach((opening) => {
      dropdownList.push({
        type: "opening",
        value: opening,
        count: opponentOpeningMap[opponent][opening],
      });
    });
  });

  return dropdownList;
};

