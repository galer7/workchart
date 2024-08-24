import React, { useState, useCallback } from "react";
import { Handle, Position, NodeProps, useReactFlow } from "reactflow";

interface NodeData {
  label: string;
}

const NodeWrapper: React.FC<NodeProps<NodeData>> = ({ id, data, children }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label);
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

  return (
    <div onDoubleClick={handleDoubleClick}>
      {React.cloneElement(children as React.ReactElement, {
        children: isEditing ? (
          <input
            type="text"
            value={label}
            onChange={handleLabelChange}
            onBlur={handleBlur}
            autoFocus
            className="nodrag w-full bg-transparent text-center focus:outline-none"
          />
        ) : (
          data.label
        ),
      })}
      <Handle
        type="source"
        position={Position.Bottom}
        id="a"
        style={{
          bottom: "-15px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "30px",
          height: "30px",
          borderRadius: "50%",
          background: "#784be8",
          border: "3px solid #fff",
          boxShadow: "0 0 10px rgba(0, 0, 0, 0.3)",
        }}
        isConnectable={true}
      />
    </div>
  );
};

export const StateNode: React.FC<NodeProps<NodeData>> = ({ id, data }) => (
  <NodeWrapper id={id} data={data}>
    <div className="px-4 py-2 shadow-md rounded-full bg-gray-200 w-20 h-20 flex items-center justify-center">
      <div className="w-full text-center">{data.label}</div>
    </div>
  </NodeWrapper>
);

export const ActionNode: React.FC<NodeProps<NodeData>> = ({ id, data }) => (
  <NodeWrapper id={id} data={data}>
    <div className="px-4 py-2 shadow-md rounded-md bg-blue-200">
      <div className="w-full text-center">{data.label}</div>
    </div>
  </NodeWrapper>
);

export const ChoiceNode: React.FC<NodeProps<NodeData>> = ({ id, data }) => (
  <NodeWrapper id={id} data={data}>
    <div
      className="px-4 py-2 shadow-md bg-green-200"
      style={{
        transform: "rotate(45deg)",
        width: "100px",
        height: "100px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{ transform: "rotate(-45deg)", width: "100%" }}
        className="text-center"
      >
        {data.label}
      </div>
    </div>
  </NodeWrapper>
);
