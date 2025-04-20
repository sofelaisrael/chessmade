import React, { useState, useEffect, useRef } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";

import {
  AiOutlineClose,
  AiFillStepForward,
  AiFillStepBackward,
  AiFillFastBackward,
  AiFillFastForward,
} from "react-icons/ai";
import { RxExit } from "react-icons/rx";
import { FaChessKing, FaClock, FaCrown, FaFlag } from "react-icons/fa6";

const ChessBoard = ({ pgn, whiteresult, blackresult, username, game }) => {
  const [chess] = useState(new Chess());
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [moves, setMoves] = useState([]);
  const [gameInfo, setGameInfo] = useState({});
  const [currentTip, setCurrentTip] = useState("");
  const [isGameInfoVisible, setIsGameInfoVisible] = useState(false);
  const [playerColor, setPlayerColor] = useState("white");
  const [opponentInfo, setOpponentInfo] = useState({ name: "", rating: "" });
  const [userInfo, setUserInfo] = useState({ name: "", rating: "" });
  const chessboardRef = useRef(null);
  const [kingPositions, setKingPositions] = useState({
    whiteKing: { top: 0, left: 0 },
    blackKing: { top: 0, left: 0 },
  });
  const [showTermination, setShowTermination] = useState(false);
  const popupRef = useRef(null);

  console.log(game, whiteresult, blackresult);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleGameInfo = () => {
    setIsGameInfoVisible((prev) => !prev);
  };

  const getPositionTip = (fen, moveIndex) => {
    if (moveIndex === 0) {
      return "Game start: White to move.";
    }

    const fenParts = fen.split(" ");
    const activeColor = fenParts[1] === "w" ? "White" : "Black";

    return `Move ${moveIndex}: ${activeColor} to move.`;
  };

  useEffect(() => {
    const calculateKingPositions = () => {
      if (!chessboardRef.current) return;

      const squareSize = chessboardRef.current.offsetWidth / 8;

      const getTopLeftFromSquare = (square) => {
        const file = square.charCodeAt(0) - 97;
        const rank = 8 - parseInt(square[1], 10);
        return {
          top: rank * squareSize,
          left: file * squareSize,
        };
      };

      const fen = chess.fen();
      const rows = fen.split(" ")[0].split("/");
      let whiteKingSquare = null;
      let blackKingSquare = null;

      rows.forEach((row, rankIndex) => {
        let fileIndex = 0;
        for (const char of row) {
          if (isNaN(char)) {
            if (char === "K")
              whiteKingSquare = `${String.fromCharCode(97 + fileIndex)}${
                8 - rankIndex
              }`;
            if (char === "k")
              blackKingSquare = `${String.fromCharCode(97 + fileIndex)}${
                8 - rankIndex
              }`;
            fileIndex++;
          } else {
            fileIndex += parseInt(char, 10);
          }
        }
      });

      const whiteKing = whiteKingSquare
        ? getTopLeftFromSquare(whiteKingSquare)
        : { top: 0, left: 0 };
      const blackKing = blackKingSquare
        ? getTopLeftFromSquare(blackKingSquare)
        : { top: 0, left: 0 };

      setKingPositions({ whiteKing, blackKing });
    };

    if (pgn) {
      try {
        chess.loadPgn(pgn);
        const history = chess.history();
        setMoves(history);
        setCurrentMoveIndex(history.length);

        const headers = chess.header();
        setGameInfo(headers);
        if (headers.White.toLocaleLowerCase() === username) {
          setPlayerColor("white");
          setUserInfo({ name: headers.White, rating: headers.WhiteElo });
          setOpponentInfo({ name: headers.Black, rating: headers.BlackElo });
        } else if (headers.Black.toLocaleLowerCase() === username) {
          setPlayerColor("black");
          setUserInfo({ name: headers.Black, rating: headers.BlackElo });
          setOpponentInfo({ name: headers.White, rating: headers.WhiteElo });
        }

        chess.reset();
        history.forEach((move) => chess.move(move));

        setCurrentTip(getPositionTip(chess.fen(), history.length));

        calculateKingPositions();

        setShowTermination(true);

        scrollToTop();
      } catch (error) {
        console.error("Failed to load PGN:", error);
      }
    } else {
      chess.reset();
      setMoves([]);
      setCurrentMoveIndex(0);
      setGameInfo({});
      setCurrentTip("");
    }
  }, [pgn, chess]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (!moves.length) return;

      if (e.key === "ArrowLeft") {
        navigateMove(-1);
      } else if (e.key === "ArrowRight") {
        navigateMove(1);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [chess, moves]);

  const navigateMove = (delta) => {
    setCurrentMoveIndex((prev) => {
      const newIndex = Math.max(0, Math.min(moves.length, prev + delta));
      chess.reset();
      moves.slice(0, newIndex).forEach((move) => chess.move(move));
      setCurrentTip(getPositionTip(chess.fen(), newIndex));
      setShowTermination(false);

      return newIndex;
    });
  };

  const navigateToStart = () => {
    chess.reset();
    setCurrentMoveIndex(0);
    setCurrentTip(getPositionTip(chess.fen(), 1));
    setShowTermination(false);
  };

  const navigateToEnd = () => {
    chess.reset();
    moves.forEach((move) => chess.move(move));
    setCurrentMoveIndex(moves.length);
    setCurrentTip(getPositionTip(chess.fen(), moves.length));
    setShowTermination(false);
  };

  const closePopup = () => {
    setShowTermination(false);
  };

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setShowTermination(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

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
        return <div className="text-white w-3 h-3 ">1/2</div>;
      case "timevsinsufficient":
        return <div className="text-white w-3 h-3 ">1/2</div>;
      case "timeoutvsinsufficient":
        return <div className="text-white w-3 h-3 ">1/2</div>;
      case "repetition":
        return <div className="text-white w-3 h-3 ">1/2</div>;
      case "agreed":
        return <div className="text-white w-3 h-3 ">1/2</div>;
      case "50move":
        return <div className="text-white w-3 h-3 ">1/2</div>;
      case "insufficient":
        return <div className="text-white w-3 h-3 ">1/2</div>;
      case "resigned":
        return <FaFlag className="text-white w-3 h-3" title="Resigned" />;
      default:
        return null;
    }
  };

  // console.log(gameInfo.Termination, opponentInfo, playerColor, blackresult, whiteresult);

  return (
    <div className="space-y-4">
      <div className="text p">
        <div className="font-semibold flex items-center gap-2">
          {opponentInfo.name && (
            <div className="sm text-white">
              {opponentInfo.name} ({opponentInfo.rating})
            </div>
          )}
          {currentMoveIndex === moves.length && currentMoveIndex !== 0 && (
            <div
              style={{
                background: `${
                  (playerColor === "black" && whiteresult === "win") ||
                  (playerColor === "white" && blackresult === "win")
                    ? "green"
                    : (playerColor === "white" && whiteresult === "win") ||
                      (playerColor === "black" && blackresult === "win")
                    ? "red"
                    : "gray"
                }`,
              }}
              className="size-6 p-1 rounded-full flex justify-center items-center icon-animation relative text-[9px]"
            >
              {playerColor === "white" ? (
                <div className="ch">{getGameStatusIcon(blackresult)}</div>
              ) : (
                <div className="ch">{getGameStatusIcon(whiteresult)}</div>
              )}
            </div>
          )}
        </div>
      </div>

      <div
        className="aspect-square max-w-md mx-auto relative"
        ref={chessboardRef}
      >
        <Chessboard
          customDarkSquareStyle={{ backgroundColor: "#171D27" }}
          customLightSquareStyle={{ backgroundColor: "#373D49" }}
          customBoardStyle={{borderRadius: "5px"}}
          // piece
          boardOrientation={playerColor}
          position={chess.fen()}
        />
        {showTermination && (
          <div
            ref={popupRef}
            className="bg-whie p-6 rounded-lg backdrop-blur-2xl shadow-lg w-fit absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2"
          >
            <p>{gameInfo.Termination}</p>

            <button
              onClick={closePopup}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              <AiOutlineClose className="w-6 h-6" />
            </button>
          </div>
        )}
      </div>

      <div className="text- p">
        <div className="font-semibold flex items-center gap-2 text-white">
          {userInfo.name && (
            <div className="sm">
              {userInfo.name} ({userInfo.rating})
            </div>
          )}
          {currentMoveIndex === moves.length && currentMoveIndex !== 0 && (
            <div
              style={{
                background: `${
                  (playerColor === "black" && whiteresult === "win") ||
                  (playerColor === "white" && blackresult === "win")
                    ? "red"
                    : (playerColor === "white" && whiteresult === "win") ||
                      (playerColor === "black" && blackresult === "win")
                    ? "green"
                    : "gray"
                }`,
              }}
              className="size-6 rounded-full flex justify-center items-center icon-animation relative text-[9px]"
            >
              {playerColor === "white" ? (
                <div className="ch">{getGameStatusIcon(whiteresult)}</div>
              ) : (
                <div className="ch">{getGameStatusIcon(blackresult)}</div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* {whiteresult} - {blackresult} */}
      <div className="flex items-center justify-center space-x-4 text-white">
        <button
          onClick={navigateToStart}
          className="p-2 rounded-lg hover:bg-[#1e1e1e] transition-colors disabled:opacity-50"
          disabled={currentMoveIndex === 0}
          title="Go to start"
        >
          <AiFillFastBackward />
        </button>
        <button
          onClick={() => navigateMove(-1)}
          className="p-2 rounded-lg hover:bg-[#1e1e1e] transition-colors disabled:opacity-50"
          disabled={currentMoveIndex === 0}
          title="Previous move"
        >
          <AiFillStepBackward />
        </button>
        <span className="font-mono px-4 py-2 bg-[#1e1e1e] rounded-lg">
          {currentMoveIndex} / {moves.length}
        </span>
        <button
          onClick={() => navigateMove(1)}
          className="p-2 rounded-lg hover:bg-[#1e1e1e] transition-colors disabled:opacity-50"
          disabled={currentMoveIndex === moves.length}
          title="Next move"
        >
          <AiFillStepForward />
        </button>
        <button
          onClick={navigateToEnd}
          className="p-2 rounded-lg hover:bg-[#1e1e1e] transition-colors disabled:opacity-50"
          disabled={currentMoveIndex === moves.length}
          title="Go to end"
        >
          <AiFillFastForward />
        </button>
      </div>
      {pgn && (
        <div className="space-y-4">
          <div className="bg-[#1e1e1e] text-white p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Moves</h4>
            <div className="flex flex-wrap gap-2">
              {moves.map((move, index) => (
                <span
                  key={index}
                  className={`px-2 py-1 rounded cursor-pointer transition-colors ${
                    index < currentMoveIndex
                      ? "bg-[#0f0f0f] hover:bg-[#00663d]"
                      : "bg-[#1e1e1e] hover:bg-[#00aa55]"
                  }`}
                  onClick={() => {
                    chess.reset();
                    moves.slice(0, index + 1).forEach((m) => chess.move(m));
                    setCurrentMoveIndex(index + 1);
                    setCurrentTip(getPositionTip(chess.fen(), index + 1));
                  }}
                >
                  {index % 2 === 0 ? `${Math.floor(index / 2) + 1}.` : ""}{" "}
                  {move}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ChessBoard;
