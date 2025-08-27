import React, { useEffect } from "react";
import { TbPlayerPlayFilled, TbPlayerTrackNextFilled, TbPlayerTrackPrevFilled } from "react-icons/tb";

export default function Controls({
  currentNode,
  setShowTermination,
  goToNode,
}) {
  const goBack = () => currentNode?.parent && goToNode(currentNode.parent)

  const goForward = () =>
    currentNode?.children?.[0] && goToNode(currentNode.children[0])

  const navigateToStart = () => {
    let node = currentNode
    while (node?.parent) node = node.parent
    goToNode(node)
  }

  const navigateToEnd = () => {
    let node = currentNode
    while (node?.children?.[0]) node = node.children[0]
    goToNode(node)
  }

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "ArrowRight") goForward()
      if (e.key === "ArrowLeft") goBack()
      if (e.key === "Home") navigateToStart()
      if (e.key === "End") navigateToEnd()
      setShowTermination(false)
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [currentNode])

  // === Your original renderMoves with variations ===
  const renderMoves = (
    node,
    moveNumber = 1,
    isWhiteMove = true,
    inVariation = false
  ) => {
    if (!node || node.children.length === 0) return null

    const firstChild = node.children[0]
    const variations = node.children.slice(1)

    const showMoveNumber = isWhiteMove ? `${moveNumber}.` : ""

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
    )

    const variationElements = variations.map((child, index) => {
      const branchMoveNumber = moveNumber
      const branchIsWhite = isWhiteMove

      const branchDisplay = branchIsWhite
        ? `${branchMoveNumber}.`
        : `${branchMoveNumber}...`

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
      )
    })

    const nextMoveNumber = isWhiteMove ? moveNumber : moveNumber + 1
    const nextIsWhiteMove = !isWhiteMove

    return (
      <span className="space-x-1 space-y-1 text-sm">
        {moveButton}
        {variationElements}
        {renderMoves(firstChild, nextMoveNumber, nextIsWhiteMove, inVariation)}
      </span>
    )
  }

  return (
    <div className="flex flex-col items-center space-y-2">
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

      <div className="text-white p-2 rounded shadow text-sm w-full">
        {(() => {
          let root = currentNode
          while (root?.parent) root = root.parent
          return renderMoves(root)
        })()}
      </div>
    </div>
  );
}
