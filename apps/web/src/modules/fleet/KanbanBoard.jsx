import { useState } from "react";
import ShipmentCard from "./ShipmentCard";

const LIGHT = {
  boardBg: "#F9FAFB",
  text: "#374151",
  muted: "#9CA3AF",
  countBg: "#F3F4F6",
  dropBg: "#EEF2FF",
  dropBorder: "#4F46E5",
  columnBg: "transparent",
};

const DARK = {
  boardBg: "#0F172A",
  text: "#CBD5E1",
  muted: "#64748B",
  countBg: "#1E293B",
  dropBg: "#1E1B4B",
  dropBorder: "#818CF8",
  columnBg: "transparent",
};

export default function KanbanBoard({
  columns = [],
  shipments = [],
  onMove,
  onOpenShipment,
  darkMode = false,
}) {
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverColumnId, setDragOverColumnId] = useState(null);

  const theme = darkMode ? DARK : LIGHT;
  const firstColumnId = columns.length > 0 ? columns[0].id : null;

  // Shipments with no column land in the first column of the working board.
  const shipmentsByColumn = {};
  columns.forEach((column) => {
    shipmentsByColumn[column.id] = [];
  });
  shipments.forEach((shipment) => {
    const target =
      shipment.columnId && shipmentsByColumn[shipment.columnId]
        ? shipment.columnId
        : firstColumnId;
    if (target) shipmentsByColumn[target].push(shipment);
  });

  const handleDragStart = (e, shipmentId) => {
    setDraggingId(shipmentId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("shipmentId", shipmentId);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverColumnId(null);
  };

  const handleColumnDragOver = (e, columnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverColumnId !== columnId) setDragOverColumnId(columnId);
  };

  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverColumnId(null);
    }
  };

  const handleDrop = (e, columnId) => {
    e.preventDefault();
    const shipmentId = e.dataTransfer.getData("shipmentId") || draggingId;
    if (shipmentId && onMove) onMove(shipmentId, columnId);
    setDragOverColumnId(null);
    setDraggingId(null);
  };

  if (columns.length === 0) {
    return (
      <div style={{ ...styles.board, background: theme.boardBg }}>
        <div style={{ ...styles.noColumns, color: theme.muted }}>
          No board columns found yet.
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...styles.board, background: theme.boardBg }}>
      {columns.map((column) => {
        const isOver = dragOverColumnId === column.id;
        const columnShipments = shipmentsByColumn[column.id] || [];

        return (
          <div
            key={column.id}
            style={{
              ...styles.column,
              background: theme.columnBg,
              border: isOver ? `1.5px dashed ${theme.dropBorder}` : "1.5px solid transparent",
              borderRadius: "10px",
              padding: isOver ? "8px" : "8px 0",
              transition: "all 0.15s",
            }}
            onDragOver={(e) => handleColumnDragOver(e, column.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <div style={styles.colHeader}>
              <span
                style={{ ...styles.colDot, background: column.color || "#6B7280" }}
              />
              <span style={{ ...styles.colLabel, color: theme.text }}>
                {String(column.name || "Column").toUpperCase()}
              </span>
              <span
                style={{ ...styles.colCount, background: theme.countBg, color: theme.muted }}
              >
                {columnShipments.length}
              </span>
            </div>

            {columnShipments.length === 0 && !isOver && (
              <div style={{ ...styles.colEmpty, color: theme.muted }}>No shipments</div>
            )}

            {columnShipments.map((shipment) => (
              <div
                key={shipment.id}
                draggable
                onDragStart={(e) => handleDragStart(e, shipment.id)}
                onDragEnd={handleDragEnd}
                style={{
                  opacity: draggingId === shipment.id ? 0.35 : 1,
                  cursor: "grab",
                  transition: "opacity 0.15s",
                }}
              >
                <ShipmentCard
                  shipment={shipment}
                  darkMode={darkMode}
                  onClick={() => onOpenShipment && onOpenShipment(shipment)}
                />
              </div>
            ))}

            {isOver && (
              <div style={{ ...styles.dropHint, color: theme.dropBorder }}>
                Drop into {column.name}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const styles = {
  board: {
    display: "flex",
    gap: "14px",
    alignItems: "flex-start",
    padding: "4px 24px 24px",
    overflowX: "auto",
    flex: 1,
    minHeight: 0,
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
    transition: "background 0.2s",
  },
  column: {
    width: "280px",
    minWidth: "280px",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
  },
  colHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "12px",
    padding: "0 4px",
  },
  colDot: {
    width: "9px",
    height: "9px",
    borderRadius: "50%",
    flexShrink: 0,
  },
  colLabel: {
    fontSize: "12px",
    fontWeight: "700",
    letterSpacing: "0.6px",
    flex: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  colCount: {
    fontSize: "11px",
    fontWeight: "600",
    borderRadius: "10px",
    padding: "1px 8px",
  },
  colEmpty: {
    fontSize: "12px",
    textAlign: "center",
    padding: "18px 8px",
    border: "1.5px dashed",
    borderColor: "rgba(148,163,184,0.4)",
    borderRadius: "8px",
    marginBottom: "10px",
  },
  dropHint: {
    textAlign: "center",
    padding: "14px",
    fontSize: "12px",
    fontWeight: "600",
    border: "1.5px dashed",
    borderColor: "currentColor",
    borderRadius: "8px",
    marginTop: "4px",
  },
  noColumns: {
    padding: "40px",
    fontSize: "14px",
    textAlign: "center",
  },
};
