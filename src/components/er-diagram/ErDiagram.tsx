import { useCallback, useEffect, useMemo, useState } from "react";
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
import Dagre from "@dagrejs/dagre";
import { invoke } from "@tauri-apps/api/core";
import { TableNode, type TableNodeData } from "./TableNode";
import { useSchemaStore } from "../../store/schemaStore";
import { useConnectionStore } from "../../store/connectionStore";
import type { ForeignKeyInfo, TableInfo } from "../../types/schema";

const nodeTypes = {
  tableNode: TableNode,
};

type TableNodeType = Node<TableNodeData>;

// Calculate node dimensions based on columns
function getNodeDimensions(table: TableInfo) {
  const NODE_WIDTH = 220;
  const NODE_HEIGHT_PER_COL = 28;
  const HEADER_HEIGHT = 40;
  return {
    width: NODE_WIDTH,
    height: HEADER_HEIGHT + table.columns.length * NODE_HEIGHT_PER_COL,
  };
}

// Apply dagre layout to nodes and edges
function applyDagreLayout(
  tables: TableInfo[],
  foreignKeys: ForeignKeyInfo[],
  focusedTableName: string | null,
  handleFocusTable: (tableName: string) => void
): { nodes: TableNodeType[]; edges: Edge[] } {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

  // Configure dagre for horizontal layout
  g.setGraph({
    rankdir: "LR", // Left to Right
    nodesep: 80, // Horizontal separation between nodes
    ranksep: 120, // Vertical separation between ranks
    marginx: 20,
    marginy: 20,
  });

  // Add nodes to dagre
  tables.forEach((table) => {
    const { width, height } = getNodeDimensions(table);
    g.setNode(table.name, { width, height });
  });

  // Add edges to dagre
  foreignKeys.forEach((fk) => {
    // Only add edge if both source and target exist in tables
    if (
      tables.some((t) => t.name === fk.source_table) &&
      tables.some((t) => t.name === fk.target_table)
    ) {
      g.setEdge(fk.source_table, fk.target_table);
    }
  });

  // Run dagre layout
  Dagre.layout(g);

  // Create React Flow nodes with dagre positions
  const nodes: TableNodeType[] = tables.map((table) => {
    const nodeWithPosition = g.node(table.name);
    const { width, height } = getNodeDimensions(table);

    return {
      id: table.name,
      type: "tableNode",
      // Dagre gives center position, convert to top-left
      position: {
        x: nodeWithPosition.x - width / 2,
        y: nodeWithPosition.y - height / 2,
      },
      data: {
        label: table.name,
        columns: table.columns,
        isFocused: table.name === focusedTableName,
        onFocus: handleFocusTable,
      },
    };
  });

  // Create React Flow edges
  const edges: Edge[] = foreignKeys
    .filter(
      (fk) =>
        tables.some((t) => t.name === fk.source_table) &&
        tables.some((t) => t.name === fk.target_table)
    )
    .map((fk) => ({
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
    }));

  return { nodes, edges };
}

export function ErDiagram() {
  const { schemas, focusedTable, setFocusedTable, clearFocusedTable } =
    useSchemaStore();
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

  // Get focused table name for current schema
  const focusedTableName = useMemo(() => {
    if (!focusedTable || focusedTable.schema !== selectedSchema) return null;
    return focusedTable.table;
  }, [focusedTable, selectedSchema]);

  // Get related tables for focused table
  const relatedTables = useMemo(() => {
    if (!focusedTableName) return null;

    const related = new Set<string>();
    related.add(focusedTableName);

    foreignKeys.forEach((fk) => {
      if (fk.source_table === focusedTableName) {
        related.add(fk.target_table);
      }
      if (fk.target_table === focusedTableName) {
        related.add(fk.source_table);
      }
    });

    return related;
  }, [focusedTableName, foreignKeys]);

  // Handle table focus from ER diagram click
  const handleFocusTable = useCallback(
    (tableName: string) => {
      setFocusedTable(selectedSchema, tableName);
    },
    [selectedSchema, setFocusedTable]
  );

  // Generate nodes and edges from tables and foreign keys using dagre layout
  useEffect(() => {
    if (tables.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    // Filter tables if focused
    const filteredTables = relatedTables
      ? tables.filter((t) => relatedTables.has(t.name))
      : tables;

    // Filter edges if focused
    const filteredForeignKeys = relatedTables
      ? foreignKeys.filter(
          (fk) =>
            relatedTables.has(fk.source_table) &&
            relatedTables.has(fk.target_table)
        )
      : foreignKeys;

    // Apply dagre layout
    const { nodes: newNodes, edges: newEdges } = applyDagreLayout(
      filteredTables,
      filteredForeignKeys,
      focusedTableName,
      handleFocusTable
    );

    setNodes(newNodes);
    setEdges(newEdges);
  }, [
    tables,
    foreignKeys,
    setNodes,
    setEdges,
    relatedTables,
    focusedTableName,
    handleFocusTable,
  ]);

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
          onChange={(e) => {
            setSelectedSchema(e.target.value);
            clearFocusedTable();
          }}
          className="rounded border border-gray-300 bg-white px-2 py-1 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700"
        >
          {schemas.map((schema) => (
            <option key={schema.name} value={schema.name}>
              {schema.name}
            </option>
          ))}
        </select>
        <span className="text-xs text-gray-500">
          {tables.length} tables, {foreignKeys.length} relationships
        </span>

        {focusedTableName && (
          <>
            <div className="mx-2 h-4 border-l border-gray-300 dark:border-gray-600" />
            <span className="text-xs text-yellow-600 dark:text-yellow-400">
              Focused: {focusedTableName}
            </span>
            <button
              onClick={clearFocusedTable}
              className="rounded bg-gray-200 px-2 py-0.5 text-xs text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Show All
            </button>
          </>
        )}
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
