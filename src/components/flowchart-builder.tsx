import { useState, useCallback, useEffect } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  Controls,
  Background,
  Edge,
  MarkerType,
  Connection,
  Node,
} from "reactflow";
import "reactflow/dist/style.css";
import { Button } from "@/components/ui/button";
import { useFlowchartState } from "@/hooks/useFlowchartState";
import { useMermaidCode } from "@/hooks/useMermaidCode";
import { StateNode, ActionNode, ChoiceNode } from "./nodes";

const flowKey = "flowchart-state";
const getNodeId = () => `node_${+new Date()}`;

const nodeTypes = {
  state: StateNode,
  action: ActionNode,
  choice: ChoiceNode,
};

const FlowchartBuilder = () => {
  const {
    nodes,
    edges,
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
    rfInstance,
    setRfInstance,
  } = useFlowchartState();
  const [showOptions, setShowOptions] = useState(false);
  const [optionsPosition, setOptionsPosition] = useState({ x: 0, y: 0 });
  const reactFlowInstance = useReactFlow();
  const { mermaidCode, generateMermaidCode, copyToClipboard, copySuccess } =
    useMermaidCode();

  // Load from localStorage on initial render
  useEffect(() => {
    const savedFlow = localStorage.getItem(flowKey);
    if (savedFlow) {
      const flow = JSON.parse(savedFlow);
      if (flow.nodes) setNodes(flow.nodes);
      if (flow.edges) setEdges(flow.edges);
      if (flow.viewport) reactFlowInstance.setViewport(flow.viewport);
    }
  }, [setNodes, setEdges, reactFlowInstance]);

  // Save to localStorage and generate Mermaid code whenever nodes or edges change
  useEffect(() => {
    if (rfInstance) {
      const flow = rfInstance.toObject();
      localStorage.setItem(flowKey, JSON.stringify(flow));
      generateMermaidCode(nodes, edges);
    }
  }, [nodes, edges, rfInstance, generateMermaidCode]);

  const onCanvasDoubleClick = useCallback(
    (event) => {
      event.preventDefault();
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      setOptionsPosition(position);
      setShowOptions(true);
    },
    [reactFlowInstance]
  );

  const onCanvasClick = useCallback(() => {
    setShowOptions(false);
  }, []);

  const addNode = useCallback(
    (type: string) => {
      const newNode: Node = {
        id: getNodeId(),
        type,
        position: optionsPosition,
        data: { label: `${type} ${nodes.length + 1}` },
      };
      setNodes((nds) => nds.concat(newNode));
      setShowOptions(false);
    },
    [optionsPosition, nodes.length, setNodes]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge: Edge = {
        ...params,
        type: "default",
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      };
      setEdges((eds) => eds.concat(newEdge));
    },
    [setEdges]
  );

  return (
    <div style={{ display: "flex", width: "100vw", height: "100vh" }}>
      <div
        style={{
          width: "300px",
          padding: "20px",
          borderRight: "1px solid #ccc",
        }}
      >
        <h3>Mermaid Code</h3>
        <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
          {mermaidCode}
        </pre>
        <Button onClick={copyToClipboard}>
          {copySuccess ? "Copied!" : "Copy to Clipboard"}
        </Button>
      </div>
      <div style={{ flex: 1, position: "relative" }}>
        <ReactFlow
          connectionMode="loose"
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          onDoubleClick={onCanvasDoubleClick}
          onClick={onCanvasClick}
          onInit={setRfInstance}
          zoomOnDoubleClick={false}
          fitView
        >
          <Controls />
          <Background gap={12} size={1} />
        </ReactFlow>

        {showOptions && (
          <div
            style={{
              position: "absolute",
              left: optionsPosition.x,
              top: optionsPosition.y,
              zIndex: 1000,
              background: "white",
              border: "1px solid #ccc",
              borderRadius: "4px",
              padding: "8px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Button onClick={() => addNode("action")}>Action</Button>
            <Button onClick={() => addNode("state")}>State</Button>
            <Button onClick={() => addNode("choice")}>Condition</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export const FlowchartBuilderWithProvider = () => (
  <ReactFlowProvider>
    <FlowchartBuilder />
  </ReactFlowProvider>
);
