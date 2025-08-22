import { setCachedGames, getCachedGames } from "./gameCache";

export async function getProfile(username) {
  const response = await fetch(`https://api.chess.com/pub/player/${username}`);
  if (!response.ok) throw new Error("Failed to fetch profile");
  return response.json();
}

export async function getUserArchivesAndGames(username) {
  try {
    // Fetch profile
    const profileRes = await fetch(
      `https://api.chess.com/pub/player/${username}`
    );
    if (!profileRes.ok) throw new Error("Failed to fetch profile");
    const profile = await profileRes.json();

    // Fetch archives
    const archiveRes = await fetch(
      `https://api.chess.com/pub/player/${username}/games/archives`
    );
    if (!archiveRes.ok) throw new Error("Failed to fetch archives");
    const archiveData = await archiveRes.json();
    const archiveUrls = archiveData.archives;

    // Build archive map
    const map = {};
    archiveUrls.forEach((url) => {
      const match = url.match(/\/(\d{4})\/(\d{1,2})$/);
      if (match) {
        const year = match[1];
        const month = match[2].padStart(2, "0");
        if (!map[year]) map[year] = [];
        map[year].push(month);
      }
    });

    Object.keys(map).forEach((year) => {
      map[year] = map[year].sort((a, b) => Number(a) - Number(b));
    });

    const sortedYears = Object.keys(map).sort((a, b) => b - a);
    const mostRecentYear = sortedYears[0];
    const mostRecentMonth = map[mostRecentYear][map[mostRecentYear].length - 1];

    // Fetch games for most recent year/month
    const key = `${mostRecentYear}-${mostRecentMonth}`;
    const games = await getMonthlyGames(
      username,
      parseInt(mostRecentYear),
      parseInt(mostRecentMonth)
    );

    return {
      profile,
      archiveMap: map,
      sortedYears,
      mostRecentYear,
      mostRecentMonth,
      games,
      key,
    };
  } catch (err) {
    console.error("Error fetching user archives/games:", err);
    throw err;
  }
}

export async function getMonthlyGames(username, year, month) {
  try {
    const cached = getCachedGames(year, month);
    if (cached) {
      return cached;
    }

    const response = await fetch(
      `https://api.chess.com/pub/player/${username}/games/${year}/${month
        .toString()
        .padStart(2, "0")}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch games: ${response.statusText}`);
    }

    const data = await response.json();

    setCachedGames(year, month, data.games);

    return data.games || [];
  } catch (error) {
    console.error("Error fetching monthly games:", error);
    return [];
  }
}
