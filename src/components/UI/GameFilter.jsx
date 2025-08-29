import React from "react";
import { RxCaretRight } from "react-icons/rx";

const GameFilter = ({ game, setSelectedGame, username }) => {
  function getGameOutcome(game, username) {
    const userIsWhite =
      game.white.username.toLowerCase() === username.toLowerCase();
    const userResult = userIsWhite ? game.white.result : game.black.result;
    const lossResults = ["checkmated", "resigned", "timeout", "abandoned"];

    if (userResult === "win") return "won";
    if (lossResults.includes(userResult)) return "lost";
    return "draw";
  }
  return (
    <li
      key={index}
      className="p-2 border border-[#494949] rounded-lg hover:bg-[#333] cursor-pointer flex items-center justify-between"
      onClick={() => setSelectedGame(game)}
    >
      <div className="flex items-center gap-3 truncate w-[70%]">
        <BiUser className="shrink-0" />
        {game.white.username.toLocaleLowerCase() ===
        username.toLocaleLowerCase() ? (
          <div className="flex items-center gap-3 truncate">
            <div className="size-3 bg-black rounded-full border shrink-0"></div>
            <div className="truncate">{game.black.username}</div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="size-3 bg-white rounded-full border "></div>
            {game.white.username}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        {getGameOutcome(game, username)} <RxCaretRight />
      </div>
    </li>
  );
};

export default GameFilter;
