import React, { FC, useCallback, useState } from "react";
import {
  getBezierPath,
  EdgeProps,
  useReactFlow,
  EdgeLabelRenderer,
  BaseEdge,
} from "reactflow";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";

const CustomEdge: FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  source,
  target,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}) => {
  const [showOptions, setShowOptions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [labelText, setLabelText] = useState(data?.label || "");
  const { setEdges, setNodes, getNode, getEdge, getNodes } = useReactFlow();

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const onPlusClick = (event) => {
    event.stopPropagation();
    setShowOptions(true);
  };

  const onDoubleClick = (event) => {
    event.stopPropagation();
    setIsEditing(true);
  };

  const onLabelChange = (event) => {
    setLabelText(event.target.value);
  };

  const onLabelBlur = () => {
    setIsEditing(false);
    setEdges((edges) =>
      edges.map((edge) => {
        if (edge.id === id) {
          return {
            ...edge,
            data: { ...edge.data, label: labelText },
          };
        }
        return edge;
      })
    );
  };

  const addNodeOnEdge = useCallback(
    (type: string) => {
      const newNode = {
        id: `${type}-${getNodes().length + 1}`,
        type,
        position: {
          x: labelX,
          y: labelY,
        },
        data: { label: `${type} ${getNodes().length + 1}` },
      };

      setNodes((nodes) => nodes.concat(newNode));

      const sourceNode = getNode(source);
      const targetNode = getNode(target);
      const existingEdge = getEdge(id);

      if (sourceNode && targetNode && existingEdge) {
        const newEdge1 = {
          id: `${source}-${newNode.id}`,
          source,
          target: newNode.id,
          type: "custom",
          markerEnd: {
            type: "arrowclosed",
          },
        };

        const newEdge2 = {
          id: `${newNode.id}-${target}`,
          source: newNode.id,
          target,
          type: "custom",
          markerEnd: {
            type: "arrowclosed",
          },
        };

        setEdges((edges) =>
          edges.filter((e) => e.id !== id).concat([newEdge1, newEdge2])
        );
      }

      setShowOptions(false);
    },
    [
      id,
      source,
      target,
      labelX,
      labelY,
      setNodes,
      setEdges,
      getNode,
      getEdge,
      getNodes,
    ]
  );

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 12,
            pointerEvents: "all",
          }}
          className="nodrag nopan"
        >
          {isEditing ? (
            <Input
              type="text"
              value={labelText}
              onChange={onLabelChange}
              onBlur={onLabelBlur}
              autoFocus
              className="w-32"
            />
          ) : (
            <div onDoubleClick={onDoubleClick} className="cursor-pointer">
              {labelText || "Double-click to edit"}
            </div>
          )}
          <Button
            onClick={onPlusClick}
            className="rounded-full w-5 h-5 flex items-center justify-center bg-pink-700 border border-gray-300 hover:bg-gray-100 nodrag mt-1"
          >
            <Plus size={12} className="text-white" />
          </Button>
          {showOptions && (
            <div className="bg-white border border-gray-300 rounded p-2 flex flex-col gap-2 mt-1">
              <Button onClick={() => addNodeOnEdge("action")}>Action</Button>
              <Button onClick={() => addNodeOnEdge("state")}>State</Button>
              <Button onClick={() => addNodeOnEdge("choice")}>Condition</Button>
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default CustomEdge;
