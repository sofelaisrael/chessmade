import React from "react";

function MoveNode({ node, isActive, onClick }) {
  return (
    <div style={{ marginLeft: "1rem", marginTop: "0.5rem" }}>
      <button
        onClick={() => onClick(node)}
        style={{
          padding: "4px 8px",
          borderRadius: "4px",
          backgroundColor: isActive ? "#2563eb" : "#4b5563",
          color: "#fff",
          fontWeight: isActive ? "bold" : "normal",
          border: "none",
          cursor: "pointer",
        }}
      >
        {node.move}
      </button>
      {node.children.length > 0 && (
        <div style={{ marginLeft: "1rem", borderLeft: "1px solid gray", paddingLeft: "0.5rem" }}>
          {node.children.map((child, idx) => (
            <MoveNode
              key={idx}
              node={child}
              isActive={isActive && child.fen === node.fen}
              onClick={onClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default MoveNode;
