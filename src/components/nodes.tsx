import React, { useState, useCallback } from "react";
import { Handle, Position, NodeProps, useReactFlow } from "reactflow";

interface NodeData {
  label: string;
}

const NodeWrapper: React.FC<NodeProps<NodeData>> = ({ id, data, type }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label);
  const [isHovered, setIsHovered] = useState(false);
  const { setNodes } = useReactFlow();

  const handleLabelChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setLabel(event.target.value);
    },
    []
  );

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          node.data = { ...node.data, label: label };
        }
        return node;
      })
    );
  }, [id, label, setNodes]);

  const handleDoubleClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    setIsEditing(true);
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  const getNodeStyle = (nodeType: string) => {
    const baseStyle = {
      width: "180px",
      height: "100px",
      border: "3px solid black",
      borderRadius: "10px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      fontWeight: "bold",
      position: "relative" as "relative",
      overflow: "hidden",
      transition: "all 0.3s ease",
      padding: "10px",
      fontSize: "14px",
    };

    switch (nodeType) {
      case "stateNode":
        return {
          ...baseStyle,
          backgroundColor: isHovered ? "#ffcce3" : "#e6e6fa",
          borderColor: "#784be8",
        };
      case "actionNode":
        return {
          ...baseStyle,
          backgroundColor: isHovered ? "#ffcce3" : "#e6f2ff",
          borderColor: "#3b82f6",
        };
      case "choiceNode":
        return {
          ...baseStyle,
          backgroundColor: isHovered ? "#ffcce3" : "#e6fff0",
          borderColor: "#10b981",
          transform: "rotate(45deg)",
          width: "120px",
          height: "120px",
        };
      default:
        return baseStyle;
    }
  };

  const handleStyle = {
    width: "100%",
    height: "100%",
    background: "transparent",
    position: "absolute" as "absolute",
    top: 0,
    left: 0,
    borderRadius: 0,
    transform: "none",
    border: "none",
    opacity: 0,
  };

  return (
    <div
      className="customNode"
      onDoubleClick={handleDoubleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="customNodeBody" style={getNodeStyle(type)}>
        <Handle
          className="customHandle"
          position={Position.Right}
          type="source"
          style={handleStyle}
        />
        <Handle
          className="customHandle"
          position={Position.Left}
          type="target"
          style={handleStyle}
        />
        <div
          style={{
            ...(type === "choiceNode" ? { transform: "rotate(-45deg)" } : {}),
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          {isEditing ? (
            <input
              type="text"
              value={label}
              onChange={handleLabelChange}
              onBlur={handleBlur}
              autoFocus
              className="nodrag w-full bg-transparent text-center focus:outline-none"
              style={{ fontSize: "14px" }}
            />
          ) : (
            <>
              <div style={{ marginBottom: "5px", wordBreak: "break-word" }}>
                {data.label}
              </div>
              <small style={{ fontSize: "12px" }}>
                {isHovered ? "Connect" : "Drag to connect"}
              </small>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export const StateNode: React.FC<NodeProps<NodeData>> = ({ id, data }) => (
  <NodeWrapper id={id} data={data} type="stateNode" />
);

export const ActionNode: React.FC<NodeProps<NodeData>> = ({ id, data }) => (
  <NodeWrapper id={id} data={data} type="actionNode" />
);

export const ChoiceNode: React.FC<NodeProps<NodeData>> = ({ id, data }) => (
  <NodeWrapper id={id} data={data} type="choiceNode" />
);

// CSS (you can add this to your global CSS or use a CSS-in-JS solution)
/*
.customNode:before {
  content: '';
  position: absolute;
  top: -10px;
  left: 50%;
  height: 20px;
  width: 40px;
  transform: translate(-50%, 0);
  background: #d6d5e6;
  z-index: 1000;
  line-height: 1;
  border-radius: 4px;
  color: #fff;
  font-size: 9px;
  border: 2px solid #222138;
}
*/
