import React, { useState, useEffect, useRef } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { parse } from "pgn-parser";
import {
  TbPlayerPlayFilled,
  TbPlayerTrackPrevFilled,
  TbPlayerTrackNextFilled,
} from "react-icons/tb";
import {
  AiOutlineClose,
} from "react-icons/ai";
import { RxExit } from "react-icons/rx";
import { FaChessKing, FaClock, FaCrown, FaFlag } from "react-icons/fa6";

const ChessBoard = ({ pgn, whiteresult, blackresult, username, game }) => {
  console.log(pgn)
  const [chess] = useState(new Chess());
  const [moveTreeRoot, setMoveTreeRoot] = useState(null);
  const [currentNode, setCurrentNode] = useState(null);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const chessboardRef = useRef(null);
  const [opponentInfo, setOpponentInfo] = useState({ name: "", rating: "" });
  const [userInfo, setUserInfo] = useState({ name: "", rating: "" });
  const [playerColor, setPlayerColor] = useState("white");
  const [showTermination, setShowTermination] = useState(false);
  const [termination, setTermination] = useState(false);
  const popupRef = useRef(null);

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
  };

  const goBack = () => {
    if (currentNode?.parent) {
      goToNode(currentNode.parent);
    }
  };

  const goForward = () => {
    if (currentNode?.children?.[0]) {
      goToNode(currentNode.children[0]);
    }
  };

  const navigateToStart = () => {
    let node = currentNode;
    while (node?.parent) {
      node = node.parent;
    }
    goToNode(node);
  };

  const navigateToEnd = () => {
    let node = currentNode;
    while (node?.children?.[0]) {
      node = node.children[0];
    }
    goToNode(node);
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
    return true;
  };

  const renderMoves = (
    node,
    moveNumber = 1,
    isWhiteMove = true,
    inVariation = false
  ) => {
    if (!node || node.children.length === 0) return null;

    const firstChild = node.children[0];
    const variations = node.children.slice(1);

    const showMoveNumber = isWhiteMove ? `${moveNumber}.` : "";

    const moveButton = firstChild && (
      <button
        key={`main-${firstChild.move}`}
        className={`cursor-pointer border rounded ${
          currentNode === firstChild
            ? "bg-[#0f0f0f] hover:bg-[#00aa55] border-[#00663d] px-2 py-1"
            : "bg-[#1e1e1e] px-2 py-1 hover:bg-[#00663d] border-black"
        } ${inVariation ? "italic text-xs px-1 text-gray-200" : ""}`}
        onClick={() => goToNode(firstChild)}
      >
        {showMoveNumber} {firstChild.move}
      </button>
    );

    const variationElements = variations.map((child, index) => {
      const branchMoveNumber = moveNumber;
      const branchIsWhite = isWhiteMove;

      const branchDisplay = branchIsWhite
        ? `${branchMoveNumber}.`
        : `${branchMoveNumber}...`;

      return (
        <span key={`variation-${index}`} className="space-x-1">
          <span className="text-gray-500">(</span>
          <span className="flx flexwrap items-center space-x-1 italic text-sm text-gray-500">
            <span>{branchDisplay}</span>
            <button
              key={`branch-${child.move}-${index}`}
              className={`px-1 border rounded ${
                currentNode === child
                  ? "bg-[#0f0f0f] hover:bg-[#00663d] border-[#00663d]"
                  : "bg-[#1e1e1e] hover:bg-[#00aa55]"
              }`}
              onClick={() => goToNode(child)}
            >
              {child.move}
            </button>
            {renderMoves(
              child,
              branchIsWhite ? branchMoveNumber : branchMoveNumber + 1,
              !branchIsWhite,
              true
            )}
          </span>
          <span className="text-gray-500">)</span>
        </span>
      );
    });

    const nextMoveNumber = isWhiteMove ? moveNumber : moveNumber + 1;
    const nextIsWhiteMove = !isWhiteMove;

    return (
      <span className="space-x-1 space-y-1 text-sm">
        {moveButton}
        {variationElements}
        {renderMoves(firstChild, nextMoveNumber, nextIsWhiteMove, inVariation)}
      </span>
    );
  };

  const getHeaderValue = (headers, name) => {
    const found = headers.find((h) => h.name === name);
    return found ? found.value : null;
  };

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

  useEffect(() => {
    if (pgn && typeof pgn === "string") {
      try {
        const parsed = parse(pgn.trim());
        const game = parsed[0];
        const chessInstance = new Chess();
        const tree = buildTreeFromPGN(game.moves, chessInstance);
        setMoveTreeRoot(tree);
        goToNode(tree);
        const whiteUsername = getHeaderValue(parsed[0].headers, "White");
        const blackUsername = getHeaderValue(parsed[0].headers, "Black");
        const whiteRating = getHeaderValue(parsed[0].headers, "WhiteElo");
        const blackRating = getHeaderValue(parsed[0].headers, "BlackElo");
        const ecoURL = getHeaderValue(parsed[0].headers, "ECOUrl")
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
    const handleKey = (e) => {
      if (e.key === "ArrowRight") goForward();
      if (e.key === "ArrowLeft") goBack();
      if (e.key === "Home") navigateToStart();
      if (e.key === "End") navigateToEnd();
      setShowTermination(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentNode]);

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
                <div className="ch font-bold">
                  {getGameStatusIcon(blackresult)}
                </div>
              ) : (
                <div className="ch font-bold">
                  {getGameStatusIcon(whiteresult)}
                </div>
              )}
            </div>
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
                <div className="ch font-bold">
                  {getGameStatusIcon(whiteresult)}
                </div>
              ) : (
                <div className="ch font-bold">
                  {getGameStatusIcon(blackresult)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center space-x-4 text-white text-[20px]">
        <button
          onClick={navigateToStart}
          className="p-2 text-[24px] rounded-lg hover:bg-[#1e1e1e] transition-colors disabled:opacity-50"
          disabled={!currentNode?.parent}
          title="Go to start"
        >
          <TbPlayerTrackPrevFilled />
        </button>
        <button
          onClick={() => goBack()}
          className="p-2 text-[24px] rounded-lg hover:bg-[#1e1e1e] transition-colors disabled:opacity-50 rotate-180"
          disabled={!currentNode?.parent}
          title="Previous move"
        >
          <TbPlayerPlayFilled />
        </button>

        <button
          onClick={() => goForward()}
          className="p-2 text-[24px] rounded-lg hover:bg-[#1e1e1e] transition-colors disabled:opacity-50"
          disabled={!currentNode?.children?.[0]}
          title="Next move"
        >
          <TbPlayerPlayFilled />
        </button>
        <button
          onClick={navigateToEnd}
          className="p-2 text-[24px] rounded-lg hover:bg-[#1e1e1e] transition-colors disabled:opacity-50"
          disabled={!currentNode?.children?.[0]}
          title="Go to end"
        >
          <TbPlayerTrackNextFilled />
        </button>
      </div>

      <div className="text-white p-2 rounded shadow text-sm">
        {renderMoves(moveTreeRoot)}
      </div>
    </div>
  );
};

export default ChessBoard;
