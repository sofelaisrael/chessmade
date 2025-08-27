import React from "react";
import { FaChessKing, FaClock, FaCrown, FaFlag } from "react-icons/fa6";
import { RxExit } from "react-icons/rx";

const GameStatus = ({ playerColor, opp = false, results }) => {
  const getGameStatusIcon = (result) => {
    switch (result) {
      case "win":
        return <FaCrown className="text-white w-3 h-3" title="Win" />;
      case "checkmated":
        return (
          <FaChessKing
            className="text-white w-3 h-3 transform -rotate-90"
            title="Checkmate"
          />
        );
      case "abandoned":
        return <RxExit className="text-white w-3 h-3" title="Left the Match" />;
      case "timeout":
        return <FaClock className="text-white w-3 h-3" title="Timeout" />;
      case "stalemate":
        return (
          <div className="text-white w-3 h-3  flex justify-center items-center font-bold text-[10px]">
            1/2
          </div>
        );
      case "timevsinsufficient":
        return (
          <div className="text-white w-3 h-3   flex justify-center items-center font-bold text-[10px]">
            1/2
          </div>
        );
      case "timeoutvsinsufficient":
        return (
          <div className="text-white w-3 h-3   flex justify-center items-center font-bold text-[10px]">
            1/2
          </div>
        );
      case "repetition":
        return (
          <div className="text-white w-3 h-3   flex justify-center items-center font-bold text-[10px]">
            1/2
          </div>
        );
      case "agreed":
        return (
          <div className="text-white w-3 h-3   flex justify-center items-center font-bold text-[10px]">
            1/2
          </div>
        );
      case "50move":
        return (
          <div className="text-white w-3 h-3   flex justify-center items-center font-bold text-[10px]">
            1/2
          </div>
        );
      case "insufficient":
        return (
          <div className="text-white w-3 h-3   flex justify-center items-center font-bold text-[10px]">
            1/2
          </div>
        );
      case "resigned":
        return <FaFlag className="text-white w-3 h-3" title="Resigned" />;
      default:
        return null;
    }
  };

  const winStatusColor = opp ? "red" : "green";
  const loseStatusColor = opp ? "red" : "green";

  return (
    <div
      style={{
        background: `${
          (playerColor === "black" && results.whiteresult === "win") ||
          (playerColor === "white" && results.blackresult === "win")
            ? loseStatusColor
            : (playerColor === "white" && results.whiteresult === "win") ||
              (playerColor === "black" && results.blackresult === "win")
            ? winStatusColor
            : "gray"
        }`,
      }}
      className="size-6 rounded-full flex justify-center items-center icon-animation relative text-[9px]"
    >
      {playerColor === opp ? "black" : "white" ? (
        <div className="ch font-bold">
          {getGameStatusIcon(results.whiteresult)}
        </div>
      ) : (
        <div className="ch font-bold">
          {getGameStatusIcon(results.blackresult)}
        </div>
      )}
    </div>
  );
};

export default GameStatus;
