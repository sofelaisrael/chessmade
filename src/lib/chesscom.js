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
    console.log('done right about now', data)
    return data.games || []; // Return the games array or an empty array if no games are found
  } catch (error) {
    console.error("Error fetching monthly games:", error);
    return []; // Return an empty array in case of an error
  }
}

export async function getAllGames(username) {
    const profile = await getProfile(username);
    const joinedDate = new Date(profile.joined * 1000); // Convert UNIX timestamp to Date
    const currentDate = new Date();
  
    const allGames = [];
    for (let year = joinedDate.getFullYear(); year <= currentDate.getFullYear(); year++) {
      const startMonth = year === joinedDate.getFullYear() ? joinedDate.getMonth() + 1 : 1;
      const endMonth = year === currentDate.getFullYear() ? currentDate.getMonth() + 1 : 12;
  
      for (let month = startMonth; month <= endMonth; month++) {
        try {
          const monthlyGames = await getMonthlyGames(username, year, month);
          allGames.push(...monthlyGames);
        } catch (error) {
          console.warn(`Failed to fetch games for ${year}-${month}:`, error);
        }
      }
    }
  
    return allGames;
}