import { useState } from "react";

export const useMermaidCode = () => {
  const [mermaidCode, setMermaidCode] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);

  const generateMermaidCode = (nodes, edges) => {
    let code = "graph TD\n";
    nodes.forEach((node) => {
      switch (node.type) {
        case "state":
          code += `  ${node.id}((${node.data.label}))\n`;
          break;
        case "action":
          code += `  ${node.id}[${node.data.label}]\n`;
          break;
        case "choice":
          code += `  ${node.id}{${node.data.label}}\n`;
          break;
      }
    });
    edges.forEach((edge) => {
      code += `  ${edge.source} -->|${edge.label || ""}| ${edge.target}\n`;
    });
    setMermaidCode(code);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(mermaidCode);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return { mermaidCode, generateMermaidCode, copyToClipboard, copySuccess };
};
