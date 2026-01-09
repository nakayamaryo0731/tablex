import { useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  ConnectionMode,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { invoke } from "@tauri-apps/api/core";
import { TableNode, type TableNodeData } from "./TableNode";
import { useSchemaStore } from "../../store/schemaStore";
import { useConnectionStore } from "../../store/connectionStore";
import type { ForeignKeyInfo } from "../../types/schema";

const nodeTypes = {
  tableNode: TableNode,
};

type TableNodeType = Node<TableNodeData>;

export function ErDiagram() {
  const { schemas } = useSchemaStore();
  const { isConnected } = useConnectionStore();
  const [foreignKeys, setForeignKeys] = useState<ForeignKeyInfo[]>([]);
  const [nodes, setNodes, onNodesChange] = useNodesState<TableNodeType>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedSchema, setSelectedSchema] = useState<string>("public");

  // Fetch foreign keys when schema changes
  useEffect(() => {
    if (isConnected && selectedSchema) {
      invoke<ForeignKeyInfo[]>("get_foreign_keys", {
        schemaName: selectedSchema,
      })
        .then(setForeignKeys)
        .catch(console.error);
    }
  }, [isConnected, selectedSchema]);

  // Get tables for selected schema
  const tables = useMemo(() => {
    const schema = schemas.find((s) => s.name === selectedSchema);
    return schema?.tables || [];
  }, [schemas, selectedSchema]);

  // Generate nodes and edges from tables and foreign keys
  useEffect(() => {
    if (tables.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    // Calculate layout - simple grid layout
    const COLS = 3;
    const NODE_WIDTH = 220;
    const NODE_HEIGHT_PER_COL = 28;
    const HEADER_HEIGHT = 40;
    const X_GAP = 80;
    const Y_GAP = 60;

    const newNodes: TableNodeType[] = tables.map((table, index) => {
      const col = index % COLS;
      const row = Math.floor(index / COLS);

      // Calculate cumulative Y position based on previous rows
      let y = 0;
      for (let r = 0; r < row; r++) {
        const maxHeightInRow = Math.max(
          ...tables
            .slice(r * COLS, (r + 1) * COLS)
            .map((t) => HEADER_HEIGHT + t.columns.length * NODE_HEIGHT_PER_COL)
        );
        y += maxHeightInRow + Y_GAP;
      }

      return {
        id: table.name,
        type: "tableNode",
        position: { x: col * (NODE_WIDTH + X_GAP), y },
        data: {
          label: table.name,
          columns: table.columns,
        },
      };
    });

    const newEdges: Edge[] = foreignKeys.map((fk) => ({
      id: fk.constraint_name,
      source: fk.source_table,
      target: fk.target_table,
      sourceHandle: `${fk.source_column}-source`,
      targetHandle: `${fk.target_column}-target`,
      type: "smoothstep",
      animated: true,
      style: { stroke: "#6366f1", strokeWidth: 2 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "#6366f1",
      },
      label: fk.constraint_name,
      labelStyle: { fontSize: 10, fill: "#6b7280" },
    }));

    setNodes(newNodes);
    setEdges(newEdges);
  }, [tables, foreignKeys, setNodes, setEdges]);

  if (!isConnected) {
    return (
      <div className="flex h-full items-center justify-center text-gray-400">
        Connect to a database to view ER diagram
      </div>
    );
  }

  if (schemas.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-gray-400">
        Loading schemas...
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-4 py-2 dark:border-gray-700 dark:bg-gray-800">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Schema:
        </label>
        <select
          value={selectedSchema}
          onChange={(e) => setSelectedSchema(e.target.value)}
          className="rounded border border-gray-300 bg-white px-2 py-1 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700"
        >
          {schemas.map((schema) => (
            <option key={schema.name} value={schema.name}>
              {schema.name}
            </option>
          ))}
        </select>
        <span className="ml-2 text-xs text-gray-500">
          {tables.length} tables, {foreignKeys.length} relationships
        </span>
      </div>
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Loose}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.1}
          maxZoom={2}
        >
          <Controls />
          <Background color="#e5e7eb" gap={16} />
        </ReactFlow>
      </div>
    </div>
  );
}
