const gameCache = new Map();

export function setCachedGames(year, month, games) {
  const key = `${year}-${month}`;
  gameCache.set(key, games);
}

export function getCachedGames(year, month) {
  const key = `${year}-${month}`;
  return gameCache.get(key) || null;
}

export function clearGameCache() {
  gameCache.clear();
}
