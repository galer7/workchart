import { type ClassValue, clsx } from "clsx";
import { Node } from "reactflow";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getNextIndex = (nodes: Node[], type) => {
  const typeNodes = nodes.filter(
    (node) => node.data.name?.startsWith(type) || false
  );

  if (typeNodes.length === 0) {
    return 1;
  }

  const existingIndices = typeNodes
    .map((node) => {
      const match = node.data.name.match(new RegExp(`${type}_(\\d+)`));
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((index) => !isNaN(index));

  if (existingIndices.length === 0) {
    return 1;
  }

  const maxIndex = Math.max(...existingIndices);
  return maxIndex + 1;
};
