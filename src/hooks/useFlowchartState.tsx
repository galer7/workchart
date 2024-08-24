import { useState, useCallback, useEffect } from "react";
import { useNodesState, useEdgesState, addEdge, useReactFlow } from "reactflow";

const flowKey = "mermaid-flowchart";

export const useFlowchartState = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [rfInstance, setRfInstance] = useState(null);
  const { setViewport } = useReactFlow();

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  useEffect(() => {
    if (rfInstance) {
      const flow = rfInstance.toObject();
      localStorage.setItem(flowKey, JSON.stringify(flow));
    }
  }, [nodes, edges, rfInstance]);

  useEffect(() => {
    const restoreFlow = async () => {
      const flow = JSON.parse(localStorage.getItem(flowKey));
      if (flow) {
        const { x = 0, y = 0, zoom = 1 } = flow.viewport;
        setNodes(flow.nodes || []);
        setEdges(flow.edges || []);
        setViewport({ x, y, zoom });
      }
    };
    restoreFlow();
  }, [setNodes, setEdges, setViewport]);

  return {
    nodes,
    edges,
    rfInstance,
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setRfInstance,
  };
};
