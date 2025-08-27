import { Chess } from "chess.js";

export const promotions = [undefined, "b", "n", "r", "q"];

export const pieceValues = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: Infinity,
  m: 0,
};

function getBoardCoordinates(square) {
  return {
    x: "abcdefgh".indexOf(square.slice(0, 1)),
    y: parseInt(square.slice(1)) - 1,
  };
}

function getSquare(coordinate) {
  return "abcdefgh".charAt(coordinate.x) + (coordinate.y + 1).toString();
}

export function getAttackers(fen, square) {
  let attackers = [];

  let board = new Chess(fen);
  let piece = board.get(square);

  if (!piece) return attackers;

  // Set colour to move to opposite of attacked piece
  board.load(
    fen
      .replace(/(?<= )(?:w|b)(?= )/g, piece.color == "w" ? "b" : "w")
      .replace(/ [a-h][1-8] /g, " - ")
  );

  // Find each legal move that captures attacked piece
  let legalMoves = board.moves({ verbose: true });

  for (let move of legalMoves) {
    if (move.to === square) {
      attackers.push({
        square: move.from,
        color: move.color,
        type: move.piece,
      });
    }
  }

  // Check opposite king adjacency
  let oppositeKing;
  let oppositeColour = piece.color == "w" ? "b" : "w";

  let pieceCoordinate = getBoardCoordinates(square);
  for (let xOffset = -1; xOffset <= 1; xOffset++) {
    for (let yOffset = -1; yOffset <= 1; yOffset++) {
      if (xOffset === 0 && yOffset === 0) continue;

      let offsetSquare = getSquare({
        x: Math.min(Math.max(pieceCoordinate.x + xOffset, 0), 7),
        y: Math.min(Math.max(pieceCoordinate.y + yOffset, 0), 7),
      });
      let offsetPiece = board.get(offsetSquare);
      if (!offsetPiece) continue;

      if (offsetPiece.color === oppositeColour && offsetPiece.type === "k") {
        oppositeKing = {
          color: offsetPiece.color,
          square: offsetSquare,
          type: offsetPiece.type,
        };
        break;
      }
    }
    if (oppositeKing) break;
  }

  if (!oppositeKing) return attackers;

  let kingCaptureLegal = false;
  try {
    board.move({
      from: oppositeKing.square,
      to: square,
    });
    kingCaptureLegal = true;
  } catch {}

  if (oppositeKing && (attackers.length > 0 || kingCaptureLegal)) {
    attackers.push(oppositeKing);
  }

  return attackers;
}

export function getDefenders(fen, square) {
  let board = new Chess(fen);
  let piece = board.get(square);
  if (!piece) return [];

  let testAttacker = getAttackers(fen, square)[0];

  if (testAttacker) {
    // Set player to move to colour of test attacker
    board.load(
      fen
        .replace(/(?<= )(?:w|b)(?= )/g, testAttacker.color)
        .replace(/ [a-h][1-8] /g, " - ")
    );

    for (let promotion of promotions) {
      try {
        board.move({
          from: testAttacker.square,
          to: square,
          promotion: promotion,
        });

        return getAttackers(board.fen(), square);
      } catch {}
    }
  } else {
    // Set player to move to defended piece colour
    board.load(
      fen
        .replace(/(?<= )(?:w|b)(?= )/g, piece.color)
        .replace(/ [a-h][1-8] /g, " - ")
    );

    board.put(
      {
        color: piece.color === "w" ? "b" : "w",
        type: "q",
      },
      square
    );

    return getAttackers(board.fen(), square);
  }

  return [];
}

export function isPieceHanging(lastFen, fen, square) {
  let lastBoard = new Chess(lastFen);
  let board = new Chess(fen);

  let lastPiece = lastBoard.get(square);
  let piece = board.get(square);

  if (!piece || !lastPiece) return false;

  let attackers = getAttackers(fen, square);
  let defenders = getDefenders(fen, square);

  // If piece was just traded equally or better, not hanging
  if (
    pieceValues[lastPiece.type] >= pieceValues[piece.type] &&
    lastPiece.color !== piece.color
  ) {
    return false;
  }

  // If a rook took a minor piece that was only defended by one other
  if (
    piece.type === "r" &&
    pieceValues[lastPiece.type] === 3 &&
    attackers.every((atk) => pieceValues[atk.type] === 3) &&
    attackers.length === 1
  ) {
    return false;
  }

  // If piece has an attacker of lower value, hanging
  if (attackers.some((atk) => pieceValues[atk.type] < pieceValues[piece.type])) {
    return true;
  }

  if (attackers.length > defenders.length) {
    let minAttackerValue = Infinity;
    for (let attacker of attackers) {
      minAttackerValue = Math.min(pieceValues[attacker.type], minAttackerValue);
    }

    if (
      pieceValues[piece.type] < minAttackerValue &&
      defenders.some((dfn) => pieceValues[dfn.type] < minAttackerValue)
    ) {
      return false;
    }

    if (defenders.some((dfn) => pieceValues[dfn.type] === 1)) {
      return false;
    }

    return true;
  }

  return false;
}
