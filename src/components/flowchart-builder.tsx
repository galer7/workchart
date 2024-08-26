import { useState, useCallback, useEffect, useRef } from "react";
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
  ConnectionMode,
} from "reactflow";
import "reactflow/dist/style.css";
import { Button } from "@/components/ui/button";
import { useFlowchartState } from "@/hooks/useFlowchartState";
import { useMermaidCode } from "@/hooks/useMermaidCode";
import { StateNode, ActionNode, ChoiceNode } from "./nodes";
import CustomEdge from "./edges";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";

const flowKey = "flowchart-state";

const nodeTypes = {
  state: StateNode,
  action: ActionNode,
  choice: ChoiceNode,
};

const edgeTypes = {
  custom: CustomEdge,
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

  const reactFlowWrapper = useRef(null);
  const [showCanvasOptions, setShowCanvasOptions] = useState(false);
  const [canvasOptionsPosition, setCanvasOptionsPosition] = useState({
    x: 0,
    y: 0,
  });
  const reactFlowInstance = useReactFlow();
  const {
    mermaidCode,
    generateMermaidCode,
    copyToClipboard,
    copyToClipboardWithMermaidPrefix,
    copySuccess,
    copyWithMermaidPrefixSuccess,
  } = useMermaidCode();

  // New state for Mermaid import
  const [mermaidImport, setMermaidImport] = useState("");
  const [showImportDialog, setShowImportDialog] = useState(false);

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
      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });
      setCanvasOptionsPosition(position);
      setShowCanvasOptions(true);
    },
    [reactFlowInstance]
  );

  const onCanvasClick = useCallback(() => {
    setShowCanvasOptions(false);
  }, []);

  const addNodeOnCanvas = useCallback(
    (type: string) => {
      const newNode: Node = {
        id: `${type}-${nodes.length + 1}`,
        type,
        position: canvasOptionsPosition,
        data: { label: `${type} ${nodes.length + 1}` },
      };
      setNodes((nds) => nds.concat(newNode));
      setShowCanvasOptions(false);
    },
    [nodes.length, canvasOptionsPosition, setNodes]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge: Edge = {
        ...params,
        id: `${params.source}-${params.target}`,
        type: "custom",
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      };
      setEdges((eds) => eds.concat(newEdge));
    },
    [setEdges]
  );

  const parseMermaidCode = (mermaidCode: string) => {
    const lines = mermaidCode.split("\n");
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    const nodeMap: {
      [key: string]: {
        depth: number;
        column: number;
        type: string;
        label: string;
      };
    } = {};
    const adjacencyList: { [key: string]: string[] } = {};

    const getNodeType = (line: string): "state" | "action" | "choice" => {
      if (line.includes("((") && line.includes("))")) return "state";
      if (line.includes("[") && line.includes("]")) return "action";
      if (line.includes("{") && line.includes("}")) return "choice";
      return "state"; // default to state if unclear
    };

    const extractLabel = (line: string): string => {
      const match = line.match(/\(\((.*?)\)\)|\[(.*?)\]|\{(.*?)\}/);
      if (match) {
        return match[1] || match[2] || match[3] || line.trim();
      }
      return line.trim();
    };

    // First pass: create adjacency list and identify all nodes
    lines.forEach((line) => {
      const trimmedLine = line.trim();
      if (trimmedLine.includes("-->")) {
        const [source, rest] = trimmedLine.split("-->");

        // Fix: Correctly parse the target, skipping edge labels
        const parts = rest.split("|");
        const target = parts[parts.length - 1].trim();
        const label =
          parts.length > 1 ? parts.slice(0, -1).join("|").trim() : "";

        const sourceId = source.trim().split(/[\s([{]|-->./)[0];
        const targetId = target.split(/[\s([{]|-->./)[0];

        if (!adjacencyList[sourceId]) adjacencyList[sourceId] = [];
        adjacencyList[sourceId].push(targetId);

        if (!nodeMap[sourceId])
          nodeMap[sourceId] = {
            depth: 0,
            column: 0,
            type: getNodeType(source),
            label: extractLabel(source),
          };
        if (!nodeMap[targetId])
          nodeMap[targetId] = {
            depth: 0,
            column: 0,
            type: getNodeType(target),
            label: extractLabel(target),
          };
      } else if (trimmedLine && !trimmedLine.startsWith("graph")) {
        const id = trimmedLine.split(/[\s([{]/)[0];
        if (!nodeMap[id])
          nodeMap[id] = {
            depth: 0,
            column: 0,
            type: getNodeType(trimmedLine),
            label: extractLabel(trimmedLine),
          };
      }
    });

    // Perform a topological sort and assign depths
    const visited: { [key: string]: boolean } = {};
    const assignDepth = (nodeId: string, depth: number) => {
      if (visited[nodeId]) return;
      visited[nodeId] = true;
      nodeMap[nodeId].depth = Math.max(nodeMap[nodeId].depth, depth);
      (adjacencyList[nodeId] || []).forEach((childId) =>
        assignDepth(childId, depth + 1)
      );
    };

    Object.keys(nodeMap).forEach((nodeId) => assignDepth(nodeId, 0));

    // Assign columns to nodes
    const depthMap: { [depth: number]: string[] } = {};
    Object.entries(nodeMap).forEach(([nodeId, data]) => {
      if (!depthMap[data.depth]) depthMap[data.depth] = [];
      depthMap[data.depth].push(nodeId);
    });

    Object.values(depthMap).forEach((nodesAtDepth, depth) => {
      nodesAtDepth.forEach((nodeId, index) => {
        nodeMap[nodeId].column = index;
      });
    });

    // Create nodes with positions based on depth and column
    const cellWidth = 300;
    const cellHeight = 200;

    const createNode = (id: string) => {
      const { depth, column, type, label } = nodeMap[id];
      const x = column * cellWidth + Math.random() * 50 - 25;
      const y = depth * cellHeight + Math.random() * 50 - 25;

      newNodes.push({
        id,
        type,
        position: { x, y },
        data: { label },
      });
    };

    // Second pass: create nodes and edges
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (trimmedLine.includes("-->")) {
        const [source, rest] = trimmedLine.split("-->");

        // Fix: Correctly parse the target and label
        const parts = rest.split("|");
        const target = parts[parts.length - 1].trim();
        const label =
          parts.length > 1 ? parts.slice(0, -1).join("|").trim() : "";

        const sourceId = source.trim().split(/[\s([{]|-->./)[0];
        const targetId = target.split(/[\s([{]|-->./)[0];

        if (!newNodes.some((node) => node.id === sourceId))
          createNode(sourceId);
        if (!newNodes.some((node) => node.id === targetId))
          createNode(targetId);

        newEdges.push({
          id: `e${index}`,
          source: sourceId,
          target: targetId,
          type: "custom",
          data: {
            label,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
        });
      } else if (trimmedLine && !trimmedLine.startsWith("graph")) {
        const id = trimmedLine.split(/[\s([{]/)[0];
        if (!newNodes.some((node) => node.id === id)) createNode(id);
      }
    });

    return { nodes: newNodes, edges: newEdges };
  };

  // New function to handle Mermaid import
  const handleMermaidImport = () => {
    if (nodes.length > 0 || edges.length > 0) {
      setShowImportDialog(true);
    } else {
      confirmImport();
    }
  };

  const confirmImport = () => {
    const { nodes: newNodes, edges: newEdges } =
      parseMermaidCode(mermaidImport);
    setNodes(newNodes);
    setEdges(newEdges);
    setMermaidImport("");
    setShowImportDialog(false);
  };

  return (
    <div style={{ display: "flex", width: "100vw", height: "100vh" }}>
      {/* Sidebar content */}
      <div
        style={{
          width: "300px",
          padding: "20px",
          borderRight: "1px solid #ccc",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
        }}
      >
        <div style={{ flex: 1 }}>
          <h1 className="text-5xl mb-5">Workchart = Workflow + Flowchart</h1>
          <h3>Mermaid Code</h3>
          <div className="flex flex-col gap-2">
            <Button
              onClick={copyToClipboard}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              {copySuccess ? "Copied!" : "Copy to Clipboard"}
            </Button>
            <Button
              onClick={copyToClipboardWithMermaidPrefix}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              {copyWithMermaidPrefixSuccess
                ? "Copied!"
                : "Copy with Mermaid Prefix"}
            </Button>
          </div>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
              marginTop: "10px",
              maxHeight: "200px",
              overflowY: "auto",
            }}
          >
            {mermaidCode}
          </pre>

          {/* Mermaid import section */}
          <h3 className="mt-5">Import Mermaid Code</h3>
          <Textarea
            value={mermaidImport}
            onChange={(e) => setMermaidImport(e.target.value)}
            placeholder="Paste your Mermaid code here"
            className="mt-2"
            style={{
              maxHeight: "200px",
              overflowY: "auto",
            }}
          />
          <Button
            onClick={handleMermaidImport}
            className="mt-2 bg-green-500 hover:bg-green-600 text-white"
          >
            Import Mermaid Code
          </Button>
        </div>
        <div style={{ marginTop: "auto" }}>
          <Button
            onClick={() => {
              setNodes([]);
              setEdges([]);
            }}
            className="bg-red-500 hover:bg-red-600 text-white w-full"
          >
            Clear All
          </Button>
        </div>
      </div>

      {/* ReactFlow canvas */}
      <div style={{ flex: 1, height: "100%" }} ref={reactFlowWrapper}>
        <ReactFlow
          connectionMode={ConnectionMode.Loose}
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onDoubleClick={onCanvasDoubleClick}
          onClick={onCanvasClick}
          onInit={setRfInstance}
          defaultEdgeOptions={{ type: "custom" }}
          zoomOnDoubleClick={false}
          fitView
        >
          <Controls />
          <Background gap={12} size={1} />
        </ReactFlow>

        {/* Canvas options menu */}
        {showCanvasOptions && (
          <div
            style={{
              position: "absolute",
              left: reactFlowInstance.flowToScreenPosition(
                canvasOptionsPosition
              ).x,
              top: reactFlowInstance.flowToScreenPosition(canvasOptionsPosition)
                .y,
              zIndex: 1000,
              background: "white",
              border: "1px solid #ccc",
              borderRadius: "4px",
              padding: "8px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <Button onClick={() => addNodeOnCanvas("action")}>Action</Button>
            <Button onClick={() => addNodeOnCanvas("state")}>State</Button>
            <Button onClick={() => addNodeOnCanvas("choice")}>Condition</Button>
          </div>
        )}
      </div>

      {/* Import confirmation dialog */}
      <AlertDialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Import</AlertDialogTitle>
            <AlertDialogDescription>
              There are existing nodes or edges in the flowchart. Importing new
              Mermaid code will replace the current flowchart. Are you sure you
              want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowImportDialog(false)}>
              Cancel
            </AlertDialogAction>
            <AlertDialogAction onClick={confirmImport}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export const FlowchartBuilderWithProvider = () => (
  <ReactFlowProvider>
    <FlowchartBuilder />
  </ReactFlowProvider>
);
