// lib/openingUtils.js

export function extractMainOpeningFromEcoUrl(ecoUrl) {
  if (!ecoUrl) return "";
  const match = ecoUrl.split("/").pop().replace(/[-.]/g, " ");
  return match.trim();
}

export function generateOpponentOpeningList(games, mainOpenings) {
  const opponentOpeningList = new Map();

  games.forEach((game) => {
    const opponent = game.white.username === game.username ? game.black.username : game.white.username;
    const openingUrl = game.opening?.eco_url;
    const mainOpeningName = extractMainOpeningFromEcoUrl(openingUrl);

    const matchedOpening = mainOpenings.find((opening) =>
      mainOpeningName.toLowerCase().includes(opening.toLowerCase())
    );

    if (opponent && matchedOpening) {
      if (!opponentOpeningList.has(opponent)) {
        opponentOpeningList.set(opponent, new Set());
      }
      opponentOpeningList.get(opponent).add(matchedOpening);
    }
  });

  const formattedOpponentOpeningList = {};
  for (const [opponent, openings] of opponentOpeningList) {
    formattedOpponentOpeningList[opponent] = Array.from(openings);
  }

  return formattedOpponentOpeningList;
}
