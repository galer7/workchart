import { useState, useCallback } from "react";

export const useMermaidCode = () => {
  const [mermaidCode, setMermaidCode] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [copyWithMermaidPrefixSuccess, setCopyWithMermaidPrefixSuccess] =
    useState(false);

  const generateMermaidCode = useCallback((nodes, edges) => {
    let code = "graph TD\n";
    nodes.forEach((node) => {
      const nodeId = node.data.label.replace(/\s+/g, "_");
      switch (node.type) {
        case "state":
          code += `  ${nodeId}((${node.data.label}))\n`;
          break;
        case "action":
          code += `  ${nodeId}[${node.data.label}]\n`;
          break;
        case "choice":
          code += `  ${nodeId}{${node.data.label}}\n`;
          break;
      }
    });
    edges.forEach((edge) => {
      const sourceId = nodes
        .find((n) => n.id === edge.source)
        ?.data.label.replace(/\s+/g, "_");
      const targetId = nodes
        .find((n) => n.id === edge.target)
        ?.data.label.replace(/\s+/g, "_");
      if (sourceId && targetId) {
        code += `  ${sourceId} -->${
          edge?.data?.label ? `|${edge.data.label}|` : ""
        } ${targetId}\n`;
      }
    });
    setMermaidCode(code);
  }, []);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(mermaidCode);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const copyToClipboardWithMermaidPrefix = async () => {
    try {
      await navigator.clipboard.writeText(
        `\`\`\`mermaid\n${mermaidCode}\n\`\`\``
      );
      setCopyWithMermaidPrefixSuccess(true);
      setTimeout(() => setCopyWithMermaidPrefixSuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return {
    mermaidCode,
    generateMermaidCode,
    copyToClipboard,
    copyToClipboardWithMermaidPrefix,
    copySuccess,
    copyWithMermaidPrefixSuccess,
  };
};
