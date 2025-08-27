import React, { useState, useEffect, useRef } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { parse } from "pgn-parser";
import { getAttackers, isPieceHanging } from "../lib/board";

import { AiOutlineClose } from "react-icons/ai";
import GameStatus from "./UI/chessboard/gameStatus";
import Controls from "./UI/chessboard/Control";

const ChessBoard = ({ pgn, whiteresult, blackresult, username }) => {
  const [chess] = useState(new Chess());
  const [currentNode, setCurrentNode] = useState(null);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const chessboardRef = useRef(null);
  const [opponentInfo, setOpponentInfo] = useState({ name: "", rating: "" });
  const [userInfo, setUserInfo] = useState({ name: "", rating: "" });
  const [playerColor, setPlayerColor] = useState("white");
  const [showTermination, setShowTermination] = useState(false);
  const [termination, setTermination] = useState(false);
  const popupRef = useRef(null);
  const [arrows, setArrows] = useState([]);

  useEffect(() => {
    updateHangingArrows();
  }, []);

  const updateArrows = (fen) => {
    const tempChess = new Chess(fen);
    const newArrows = [];

    // Example: arrows for all captures
    tempChess.moves({ verbose: true }).forEach((move) => {
      if (move.captured) {
        newArrows.push([move.from, move.to]); // format supported by react-chessboard
      }
    });

    setArrows(newArrows);
  };

  const buildTreeFromPGN = (moves, chessInstance, parent = null) => {
    const node = {
      move: null,
      fen: chessInstance.fen(),
      children: [],
      parent,
    };

    let current = node;
    for (const moveObj of moves) {
      const result = chessInstance.move(moveObj.move);
      const newNode = {
        move: result.san,
        fen: chessInstance.fen(),
        children: [],
        parent: current,
      };
      current.children.push(newNode);

      if (moveObj.variations) {
        for (const variation of moveObj.variations) {
          const branchChess = new Chess(current.fen);
          const branchNode = buildTreeFromPGN(variation, branchChess, current);
          current.children.push(...branchNode.children);
        }
      }
      current = newNode;
    }
    return node;
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

  const updateHangingArrows = () => {
    const fen = chess.fen();
    const board = new Chess(fen);

    let arrows = [];

    console.log(board);

    // loop over all squares
    board["_board"].forEach((square) => {
      const piece = board.get(square);
      if (!piece) return;

      // if opponent can capture it
      const attackers = board.SQUARES.filter((s) => {
        const moves = board.moves({ square: s, verbose: true });
        return moves.some((m) => m.to === square);
      });

      if (attackers.length > 0) {
        attackers.forEach((att) => {
          arrows.push([att, square]); // attacker -> victim
        });
      }
    });

    setArrows(arrows);
  };

  const goToNode = (node) => {
    if (!node) return;
    chess.load(node.fen);
    setCurrentNode(node);
    let idx = 0;
    let temp = node;
    while (temp && temp.parent) {
      idx++;
      temp = temp.parent;
    }
    setCurrentMoveIndex(idx);
    updateArrows(node.fen);
  };

  const handlePieceDrop = (sourceSquare, targetSquare) => {
    const tempChess = new Chess(currentNode.fen);
    const move = tempChess.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: "q",
    });
    if (!move) return false;

    const existing = currentNode.children.find(
      (child) => child.move === move.san
    );
    if (existing) {
      goToNode(existing);
      return true;
    }

    const newNode = {
      move: move.san,
      fen: tempChess.fen(),
      children: [],
      parent: currentNode,
    };
    currentNode.children.push(newNode);
    goToNode(newNode);
    updateArrows(node.fen);
    return true;
  };

  const getHeaderValue = (headers, name) => {
    const found = headers.find((h) => h.name === name);
    return found ? found.value : null;
  };

  useEffect(() => {
    if (pgn && typeof pgn === "string") {
      try {
        const parsed = parse(pgn.trim());
        const game = parsed[0];
        const chessInstance = new Chess();
        const tree = buildTreeFromPGN(game.moves, chessInstance);
        goToNode(tree);
        const whiteUsername = getHeaderValue(parsed[0].headers, "White");
        const blackUsername = getHeaderValue(parsed[0].headers, "Black");
        const whiteRating = getHeaderValue(parsed[0].headers, "WhiteElo");
        const blackRating = getHeaderValue(parsed[0].headers, "BlackElo");
        const ecoURL = getHeaderValue(parsed[0].headers, "ECOUrl");
        console.log(ecoURL);

        setTermination(getHeaderValue(parsed[0].headers, "Termination"));
        setShowTermination(true);

        if (whiteUsername.toLowerCase() === username.toLowerCase()) {
          setUserInfo({ name: whiteUsername, rating: whiteRating });
          setOpponentInfo({ name: blackUsername, rating: blackRating });
          setPlayerColor("white");
        } else {
          setOpponentInfo({ name: whiteUsername, rating: whiteRating });
          setUserInfo({ name: blackUsername, rating: blackRating });
          setPlayerColor("black");
        }
      } catch (err) {
        console.error("PGN parse failed", err);
      }
    }
  }, [pgn]);

  useEffect(() => {
    // if (currentNode)
    console.log(arrows);
  }, [arrows]);

  return (
    <div className="space-y-4 max-md:px-2">
      <div className="text quicksand mx-auto max-lg:w-[446px] sm:w-[446px]">
        <div className="font-semibold flex items-center gap-2">
          {opponentInfo.name && (
            <div className="sm text-white">
              {opponentInfo.name} ({opponentInfo.rating})
            </div>
          )}
          {currentMoveIndex !== 0 && (
            <GameStatus
              playerColor={playerColor}
              opp
              results={{ blackresult, whiteresult }}
            />
          )}
        </div>
      </div>
      <div
        className="aspect-square max-w-md mx-auto relative "
        ref={chessboardRef}
      >
        <Chessboard
          customDarkSquareStyle={{ backgroundColor: "#171D27" }}
          customLightSquareStyle={{ backgroundColor: "#373D49" }}
          customBoardStyle={{ borderRadius: "5px" }}
          customArrows={arrows}
          boardOrientation={playerColor}
          position={chess.fen()}
          onPieceDrop={handlePieceDrop}
        />
        {showTermination && (
          <div
            ref={popupRef}
            className="bg-whie p-6 rounded-lg backdrop-blur-2xl shadow-lg w-fit absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 text-white font-bold leading-[15px]"
          >
            <p>{termination}</p>

            <button
              onClick={closePopup}
              className="absolute top-2 right-2 text-white hover:text-gray-700"
            >
              <AiOutlineClose className="w-6 h-6" />
            </button>
          </div>
        )}
      </div>
      <div className="text- quicksand max-lg:w-[446px] sm:w-[446px] mx-auto">
        <div className="font-semibold flex items-center gap-2 text-white">
          {userInfo.name && (
            <div className="sm">
              {userInfo.name} ({userInfo.rating})
            </div>
          )}
          {currentMoveIndex !== 0 && (
            <GameStatus
              playerColor={playerColor}
              results={{ blackresult, whiteresult }}
            />
          )}
        </div>
      </div>

      <Controls
        currentNode={currentNode}
        goToNode={goToNode}
        setShowTermination={setShowTermination}
      />
    </div>
  );
};

export default ChessBoard;
