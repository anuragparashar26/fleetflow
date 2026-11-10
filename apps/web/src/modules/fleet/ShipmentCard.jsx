import { CalendarIcon } from "../../components/icons";
import { PRIORITY_BADGE, fmtDate } from "./shared";

const LIGHT = {
  cardBg: "#FFFFFF",
  border: "#E5E7EB",
  text: "#111827",
  muted: "#6B7280",
};
const DARK = {
  cardBg: "#1E293B",
  border: "#334155",
  text: "#F1F5F9",
  muted: "#94A3B8",
};

function driverNames(shipment) {
  return (shipment?.drivers || [])
    .map((entry) => {
      const driver = entry?.driver;
      if (!driver) return "";
      return [driver.firstName, driver.lastName].filter(Boolean).join(" ");
    })
    .filter(Boolean);
}

export default function ShipmentCard({ shipment, onClick, darkMode = false }) {
  const theme = darkMode ? DARK : LIGHT;
  const priority = PRIORITY_BADGE[shipment?.priority] || PRIORITY_BADGE.normal;
  const drivers = driverNames(shipment);
  const due = shipment?.deliveryDueAt ? fmtDate(shipment.deliveryDueAt) : "";

  return (
    <div
      style={{
        ...localStyles.card,
        background: theme.cardBg,
        border: `1px solid ${theme.border}`,
      }}
      onClick={onClick}
    >
      <div style={localStyles.headerRow}>
        <span style={{ ...localStyles.priority, ...priority }}>
          {String(shipment?.priority || "normal").toUpperCase()}
        </span>
        <span style={{ ...localStyles.tracking, color: theme.muted }}>
          {shipment?.trackingNo || ""}
        </span>
      </div>

      <div style={{ ...localStyles.title, color: theme.text }}>
        {shipment?.title || "Untitled shipment"}
      </div>

      <div style={{ ...localStyles.route, color: theme.muted }}>
        {shipment?.origin || "?"} <span style={localStyles.arrow}>→</span> {shipment?.destination || "?"}
      </div>

      {shipment?.shipper?.name && (
        <div style={{ ...localStyles.meta, color: theme.muted }}>
          Shipper: {shipment.shipper.name}
        </div>
      )}

      {drivers.length > 0 && (
        <div style={{ ...localStyles.meta, color: theme.muted }}>
          Drivers: {drivers.join(", ")}
        </div>
      )}

      {due && (
        <div style={localStyles.footer}>
          <span style={{ ...localStyles.due, color: "#F59E0B" }}>
            <CalendarIcon size={12} color="#F59E0B" /> Due {due}
          </span>
        </div>
      )}
    </div>
  );
}

const localStyles = {
  card: {
    borderRadius: "10px",
    padding: "12px 14px",
    cursor: "pointer",
    marginBottom: "10px",
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
    transition: "box-shadow 0.15s",
  },
  headerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
    marginBottom: "8px",
  },
  priority: {
    fontSize: "10px",
    fontWeight: "700",
    padding: "3px 8px",
    borderRadius: "4px",
    letterSpacing: "0.4px",
  },
  tracking: {
    fontSize: "11px",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    letterSpacing: "0.3px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  title: {
    fontSize: "14px",
    fontWeight: "600",
    lineHeight: "1.45",
    marginBottom: "5px",
  },
  route: {
    fontSize: "12px",
    lineHeight: "1.5",
    marginBottom: "6px",
    wordBreak: "break-word",
  },
  arrow: { fontWeight: "700", padding: "0 2px" },
  meta: {
    fontSize: "11.5px",
    lineHeight: "1.5",
    marginBottom: "3px",
    wordBreak: "break-word",
  },
  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: "8px",
  },
  due: {
    fontSize: "11.5px",
    fontWeight: "600",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
  },
};
