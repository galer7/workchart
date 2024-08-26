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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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

  // Function to parse Mermaid code and create nodes/edges
  const parseMermaidCode = (mermaidCode: string) => {
    const lines = mermaidCode.split("\n");
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    const nodeMap: { [key: string]: boolean } = {};

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (trimmedLine.includes("-->")) {
        const [source, target] = trimmedLine.split("-->").map((s) => s.trim());
        newEdges.push({
          id: `e${index}`,
          source,
          target,
          type: "custom",
          markerEnd: { type: MarkerType.ArrowClosed },
        });
      } else if (trimmedLine && !trimmedLine.startsWith("graph")) {
        let id, label;
        if (trimmedLine.includes("[")) {
          [id, label] = trimmedLine.split("[");
          label = label.slice(0, -1); // Remove the closing bracket
        } else {
          id = trimmedLine;
          label = trimmedLine;
        }
        id = id.trim();
        if (!nodeMap[id]) {
          newNodes.push({
            id: id,
            type: "action", // Default to action type
            position: {
              x: 100 * (newNodes.length + 1),
              y: 100 * (newNodes.length + 1),
            },
            data: { label: label || id },
          });
          nodeMap[id] = true;
        }
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
