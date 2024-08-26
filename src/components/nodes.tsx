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
      position: "relative" as const,
      overflow: "visible",
      transition: "all 0.3s ease",
      padding: "10px",
      fontSize: "14px",
      cursor: "move",
    };

    switch (nodeType) {
      case "stateNode":
        return {
          ...baseStyle,
          backgroundColor: isHovered ? "#ffcce3" : "#e6e6fa",
          borderColor: "#784be8",
          borderRadius: "50%", // Make it oval
          width: "200px", // Adjust width for oval shape
          height: "120px", // Adjust height for oval shape
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

  const topHandleStyle = {
    width: "40px",
    height: "20px",
    background: "#d6d5e6",
    top: "-20px",
    left: "50%",
    transform: "translateX(-50%)",
    borderRadius: "4px 4px 0 0",
    border: "2px solid #222138",
    borderBottom: "none",
    zIndex: 1000,
  };

  const hiddenHandleStyle = {
    opacity: 0,
    width: "100%",
    height: "50%",
    background: "transparent",
    border: "none",
    pointerEvents: "none",
  };

  return (
    <div
      className="customNode"
      onDoubleClick={handleDoubleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Handle
        type="source"
        position={Position.Top}
        style={topHandleStyle}
        isConnectable={true}
      />
      <div className="customNodeBody" style={getNodeStyle(type)}>
        <Handle
          type="target"
          position={Position.Left}
          style={{ ...hiddenHandleStyle, left: -3 }}
          isConnectable={true}
        />
        <Handle
          type="source"
          position={Position.Right}
          style={{ ...hiddenHandleStyle, right: -3 }}
          isConnectable={true}
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
                {isHovered ? "Drag to move" : "Double-click to edit"}
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
