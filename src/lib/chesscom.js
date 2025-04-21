export async function getProfile(username) {
  const response = await fetch(`https://api.chess.com/pub/player/${username}`);
  if (!response.ok) throw new Error("Failed to fetch profile");
  return response.json();
}

export async function getMonthlyGames(username, year, month) {
  try {
    const response = await fetch(
      `https://api.chess.com/pub/player/${username}/games/${year}/${month
        .toString()
        .padStart(2, "0")}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch games: ${response.statusText}`);
    }

    const data = await response.json();
    return data.games || []; 
  } catch (error) {
    console.error("Error fetching monthly games:", error);
    return []; 
  }
}