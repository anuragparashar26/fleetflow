// Shared themes, layout styles and small helpers used across the fleet module.

export const LIGHT = {
  pageBg: "#F9FAFB",
  navBg: "#FFFFFF",
  border: "#E5E7EB",
  text: "#111827",
  subText: "#374151",
  muted: "#9CA3AF",
  searchBg: "#F9FAFB",
  toggleBg: "#F3F4F6",
  cardBg: "#FFFFFF",
  tableHeadBg: "#F9FAFB",
  rowHover: "#F9FAFB",
  inputBg: "#FFFFFF",
  inputBorder: "#E5E7EB",
  inputText: "#111827",
  mutedBg: "#F3F4F6",
};

export const DARK = {
  pageBg: "#080B12",
  navBg: "#0E1524",
  border: "#1E293B",
  text: "#F8FAFC",
  subText: "#CBD5E1",
  muted: "#7C8BA1",
  searchBg: "#0B1120",
  toggleBg: "#172033",
  cardBg: "#0E1524",
  tableHeadBg: "#0B1120",
  rowHover: "#131E31",
  inputBg: "#0B1120",
  inputBorder: "#26364F",
  inputText: "#F8FAFC",
  mutedBg: "#172033",
};

export const styles = {
  // ── Page shell ──
  page: {
    display: "flex",
    width: "100vw",
    height: "100vh",
    overflow: "hidden",
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
    transition: "background 0.2s",
  },
  mainArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    minWidth: 0,
  },
  topNav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "18px 28px",
    borderBottom: "1px solid",
    gap: "16px",
    flexWrap: "wrap",
    transition: "background 0.2s",
  },
  navLeft: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    flex: 1,
    minWidth: "260px",
    flexWrap: "wrap",
  },
  pageTitle: {
    fontSize: "20px",
    fontWeight: "800",
    letterSpacing: "-0.6px",
    whiteSpace: "nowrap",
  },
  searchWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    border: "1px solid",
    borderRadius: "10px",
    padding: "10px 14px",
    flex: 1,
    maxWidth: "340px",
  },
  searchIcon: { fontSize: "14px", color: "#9CA3AF", flexShrink: 0 },
  searchInput: {
    border: "none",
    outline: "none",
    fontSize: "14px",
    flex: 1,
    minWidth: "120px",
    fontFamily: "inherit",
    background: "transparent",
  },
  clearBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "12px",
    padding: "2px 4px",
    flexShrink: 0,
    fontFamily: "inherit",
  },
  navRight: { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" },
  iconBtn: {
    border: "none",
    cursor: "pointer",
    fontSize: "18px",
    padding: "7px 10px",
    borderRadius: "8px",
    lineHeight: "1",
    fontFamily: "inherit",
  },
  workspaceSelect: {
    border: "1px solid",
    borderRadius: "8px",
    padding: "8px 10px",
    fontSize: "13px",
    fontFamily: "inherit",
    cursor: "pointer",
    maxWidth: "200px",
    outline: "none",
  },

  // ── Buttons ──
  btnPrimary: {
    border: "none",
    borderRadius: "8px",
    background: "linear-gradient(135deg, #2563EB, #0EA5E9)",
    color: "#fff",
    fontWeight: "600",
    fontSize: "13px",
    padding: "9px 16px",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  btnSecondary: {
    border: "1px solid #29466D",
    borderRadius: "8px",
    background: "#13233A",
    color: "#93C5FD",
    fontWeight: "600",
    fontSize: "12px",
    padding: "8px 12px",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  btnDanger: {
    border: "1px solid #FCA5A5",
    borderRadius: "8px",
    background: "#FEF2F2",
    color: "#B91C1C",
    fontWeight: "600",
    fontSize: "12px",
    padding: "8px 12px",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  btnNeutral: {
    border: "1px solid",
    borderRadius: "8px",
    background: "transparent",
    fontWeight: "600",
    fontSize: "12px",
    padding: "8px 12px",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  btnSmall: {
    border: "1px solid",
    borderRadius: "6px",
    background: "transparent",
    fontWeight: "600",
    fontSize: "11px",
    padding: "5px 10px",
    cursor: "pointer",
    fontFamily: "inherit",
    whiteSpace: "nowrap",
  },
  btnLink: {
    border: "none",
    background: "none",
    color: "#2563EB",
    fontWeight: "600",
    fontSize: "12px",
    padding: "4px 6px",
    cursor: "pointer",
    fontFamily: "inherit",
  },

  // ── Banners ──
  errorBanner: {
    border: "1px solid #FECACA",
    background: "#FEF2F2",
    color: "#B91C1C",
    borderRadius: "8px",
    padding: "9px 12px",
    fontSize: "12px",
    margin: "12px 24px 0",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
  },
  successBanner: {
    border: "1px solid #BBF7D0",
    background: "#F0FDF4",
    color: "#166534",
    borderRadius: "8px",
    padding: "9px 12px",
    fontSize: "12px",
    margin: "12px 24px 0",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
  },
  bannerDismiss: {
    border: "none",
    background: "none",
    cursor: "pointer",
    fontSize: "12px",
    padding: "0 2px",
    fontFamily: "inherit",
    color: "inherit",
  },

  // ── Panels & content ──
  content: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    minHeight: 0,
  },
  scrollContent: {
    flex: 1,
    overflowY: "auto",
    padding: "20px 24px 28px",
    transition: "background 0.2s",
  },
  panel: {
    border: "1px solid",
    borderRadius: "12px",
    padding: "16px",
    marginBottom: "16px",
  },
  panelTitle: {
    fontSize: "14px",
    fontWeight: "700",
    marginBottom: "10px",
  },
  mutedText: { fontSize: "13px", lineHeight: "1.6" },
  emptyState: {
    textAlign: "center",
    padding: "40px 20px",
    fontSize: "14px",
  },
  loadingRow: {
    padding: "24px",
    fontSize: "13px",
    textAlign: "center",
  },

  // ── KPI cards ──
  kpiRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
    gap: "12px",
    marginBottom: "16px",
  },
  kpiCard: {
    borderRadius: "14px",
    padding: "18px 18px",
    border: "1px solid",
    position: "relative",
    overflow: "hidden",
  },
  kpiLabel: { fontSize: "12px", fontWeight: "600", marginBottom: "6px" },
  kpiValue: { fontSize: "24px", fontWeight: "700", letterSpacing: "-0.5px" },
  kpiAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: "4px",
  },

  // ── Toolbar ──
  toolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
    marginBottom: "12px",
  },
  toolbarActions: { display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" },
  toolbarMeta: { fontSize: "12px" },

  // ── Table ──
  tableWrap: {
    border: "1px solid",
    borderRadius: "12px",
    overflow: "auto",
    marginBottom: "16px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "13px",
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
  },
  th: {
    textAlign: "left",
    padding: "11px 14px",
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "0.6px",
    textTransform: "uppercase",
    borderBottom: "1px solid",
    whiteSpace: "nowrap",
    position: "sticky",
    top: 0,
    zIndex: 1,
  },
  td: {
    padding: "11px 14px",
    borderBottom: "1px solid",
    verticalAlign: "middle",
  },
  cellStrong: { fontWeight: "600" },
  cellSub: { fontSize: "11px", marginTop: "2px" },
  rowActions: { display: "flex", gap: "6px", justifyContent: "flex-end", flexWrap: "wrap" },
  iconAction: {
    border: "1px solid",
    borderRadius: "6px",
    background: "transparent",
    cursor: "pointer",
    fontSize: "13px",
    lineHeight: "1",
    padding: "5px 7px",
    fontFamily: "inherit",
  },

  // ── Badges ──
  badge: {
    display: "inline-block",
    fontSize: "11px",
    fontWeight: "600",
    padding: "3px 9px",
    borderRadius: "999px",
    whiteSpace: "nowrap",
  },
  mono: {
    fontSize: "11px",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    letterSpacing: "0.3px",
  },

  // ── Forms ──
  fieldGroup: { marginBottom: "14px" },
  label: {
    display: "block",
    fontSize: "13px",
    fontWeight: "500",
    color: "#374151",
    marginBottom: "6px",
  },
  input: {
    width: "100%",
    padding: "9px 12px",
    borderRadius: "8px",
    border: "1.5px solid #E5E7EB",
    fontSize: "14px",
    color: "#111827",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
    background: "#FFFFFF",
  },
  select: {
    width: "100%",
    padding: "9px 12px",
    borderRadius: "8px",
    border: "1.5px solid #E5E7EB",
    fontSize: "14px",
    color: "#111827",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
    background: "#FFFFFF",
    cursor: "pointer",
  },
  textarea: {
    width: "100%",
    padding: "9px 12px",
    borderRadius: "8px",
    border: "1.5px solid #E5E7EB",
    fontSize: "14px",
    color: "#111827",
    outline: "none",
    resize: "vertical",
    boxSizing: "border-box",
    fontFamily: "inherit",
    lineHeight: "1.6",
    background: "#FFFFFF",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "0 14px",
  },
  formGridFull: { gridColumn: "1 / -1" },
  requiredMark: { color: "#EF4444" },
  inlineError: {
    fontSize: "12px",
    color: "#EF4444",
    marginTop: "4px",
  },
  checkGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: "6px",
    border: "1.5px solid #E5E7EB",
    borderRadius: "8px",
    padding: "10px 12px",
    maxHeight: "160px",
    overflowY: "auto",
  },
  checkItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    color: "#374151",
    cursor: "pointer",
  },
  stopRow: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
    marginBottom: "8px",
  },

  // ── Modal ──
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
    padding: "20px",
  },
  modal: {
    background: "#FFFFFF",
    borderRadius: "14px",
    width: "100%",
    maxWidth: "560px",
    maxHeight: "90vh",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
    overflow: "hidden",
  },
  modalWide: { maxWidth: "720px" },
  modalHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "18px 22px 14px",
    borderBottom: "1px solid #F3F4F6",
  },
  modalTitle: { fontSize: "16px", fontWeight: "700", color: "#111827" },
  modalSub: { fontSize: "12px", color: "#9CA3AF", marginTop: "3px" },
  closeBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
    color: "#9CA3AF",
    padding: "4px",
  },
  modalBody: { flex: 1, overflowY: "auto", padding: "18px 22px" },
  modalFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    padding: "14px 22px",
    borderTop: "1px solid #F3F4F6",
    flexWrap: "wrap",
  },
  modalFooterRight: { display: "flex", gap: "10px", marginLeft: "auto" },
  sectionTitle: {
    fontSize: "12px",
    fontWeight: "700",
    letterSpacing: "0.5px",
    textTransform: "uppercase",
    color: "#6B7280",
    margin: "18px 0 10px",
    paddingBottom: "6px",
    borderBottom: "1px solid #F3F4F6",
  },
  modalBanner: {
    border: "1px solid #FECACA",
    background: "#FEF2F2",
    color: "#B91C1C",
    borderRadius: "8px",
    padding: "8px 10px",
    fontSize: "12px",
    marginBottom: "12px",
  },
  modalSuccess: {
    border: "1px solid #BBF7D0",
    background: "#F0FDF4",
    color: "#166534",
    borderRadius: "8px",
    padding: "8px 10px",
    fontSize: "12px",
    marginBottom: "12px",
  },

  // ── Misc ──
  listRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    border: "1px solid",
    borderRadius: "8px",
    padding: "8px 10px",
    fontSize: "12px",
    flexWrap: "wrap",
  },
  timeline: { display: "flex", flexDirection: "column", gap: "8px" },
  timelineItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "13px",
  },
  dot: {
    width: "9px",
    height: "9px",
    borderRadius: "50%",
    flexShrink: 0,
  },
  commentItem: {
    borderRadius: "8px",
    padding: "9px 12px",
    marginBottom: "8px",
    fontSize: "13px",
  },
  commentHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "3px",
    gap: "8px",
  },
};

// ── Modal theming ────────────────────────────────────────────────────────────

export const MODAL_LIGHT = {
  bg: "#FFFFFF",
  text: "#111827",
  sub: "#6B7280",
  border: "#F3F4F6",
  fieldLabel: "#374151",
  inputBg: "#FFFFFF",
  inputBorder: "#E5E7EB",
  inputText: "#111827",
  rowBg: "#F9FAFB",
  footerBg: "transparent",
};

export const MODAL_DARK = {
  bg: "#1E293B",
  text: "#F1F5F9",
  sub: "#94A3B8",
  border: "#334155",
  fieldLabel: "#CBD5E1",
  inputBg: "#0F172A",
  inputBorder: "#334155",
  inputText: "#F1F5F9",
  rowBg: "#0F172A",
  footerBg: "#1E293B",
};

export function modalTheme(darkMode) {
  return darkMode ? MODAL_DARK : MODAL_LIGHT;
}

/** Theme-aware variants of the shared form/modal styles. */
export function themed(mt) {
  return {
    input: {
      ...styles.input,
      background: mt.inputBg,
      borderColor: mt.inputBorder,
      color: mt.inputText,
    },
    select: {
      ...styles.select,
      background: mt.inputBg,
      borderColor: mt.inputBorder,
      color: mt.inputText,
    },
    textarea: {
      ...styles.textarea,
      background: mt.inputBg,
      borderColor: mt.inputBorder,
      color: mt.inputText,
    },
    label: { ...styles.label, color: mt.fieldLabel },
    modal: { ...styles.modal, background: mt.bg },
    modalHeader: { ...styles.modalHeader, borderBottomColor: mt.border },
    modalTitle: { ...styles.modalTitle, color: mt.text },
    modalSub: { ...styles.modalSub, color: mt.sub },
    modalFooter: { ...styles.modalFooter, borderTopColor: mt.border, background: mt.footerBg },
    sectionTitle: { ...styles.sectionTitle, color: mt.sub, borderBottomColor: mt.border },
    checkGrid: {
      ...styles.checkGrid,
      background: mt.inputBg,
      borderColor: mt.inputBorder,
    },
    checkItem: { ...styles.checkItem, color: mt.fieldLabel },
    commentItem: { ...styles.commentItem, background: mt.rowBg },
    listRow: { ...styles.listRow, borderColor: mt.border },
    muted: { ...styles.mutedText, color: mt.sub },
  };
}

// ── Workspace storage ────────────────────────────────────────────────────────

const WORKSPACE_KEY = "fleet_workspace_id";

export function readWorkspaceId() {
  try {
    return window.localStorage.getItem(WORKSPACE_KEY) || null;
  } catch {
    return null;
  }
}

export function writeWorkspaceId(id) {
  try {
    if (id) window.localStorage.setItem(WORKSPACE_KEY, id);
    else window.localStorage.removeItem(WORKSPACE_KEY);
  } catch {
    // Storage may be unavailable; the backend default workspace still works.
  }
}

export function clearWorkspaceId() {
  writeWorkspaceId(null);
}

export function isWorkspaceAccessError(err) {
  return Boolean(err) && err.status === 403 && Boolean(readWorkspaceId());
}

// ── Formatting helpers ───────────────────────────────────────────────────────

function pad2(value) {
  return String(value).padStart(2, "0");
}

/** ISO value → "YYYY-MM-DDTHH:mm" for datetime-local inputs (local time). */
export function toInputDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

export function toInputDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function fmtDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function fmtDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${fmtDate(value)}, ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

export function fmtMoney(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "₹0";
  return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export function orDash(value) {
  return value === null || value === undefined || value === "" ? "—" : String(value);
}

// ── Badges ───────────────────────────────────────────────────────────────────

export const PRIORITY_BADGE = {
  low: { background: "#F3F4F6", color: "#6B7280" },
  normal: { background: "#DBEAFE", color: "#1D4ED8" },
  high: { background: "#FEF3C7", color: "#D97706" },
  urgent: { background: "#FEE2E2", color: "#DC2626" },
};

export const STATUS_BADGE = {
  // vehicles
  idle: { background: "#F3F4F6", color: "#6B7280" },
  assigned: { background: "#DBEAFE", color: "#1D4ED8" },
  maintenance: { background: "#FEF3C7", color: "#D97706" },
  offline: { background: "#FEE2E2", color: "#DC2626" },
  // drivers
  available: { background: "#D1FAE5", color: "#059669" },
  on_trip: { background: "#EDE9FE", color: "#7C3AED" },
  off_duty: { background: "#F3F4F6", color: "#6B7280" },
  // routes / shippers
  active: { background: "#D1FAE5", color: "#059669" },
  inactive: { background: "#F3F4F6", color: "#6B7280" },
  // trips
  planned: { background: "#DBEAFE", color: "#1D4ED8" },
  in_transit: { background: "#FEF3C7", color: "#D97706" },
  completed: { background: "#D1FAE5", color: "#059669" },
  cancelled: { background: "#FEE2E2", color: "#DC2626" },
  // activities
  pickup: { background: "#EDE9FE", color: "#7C3AED" },
  delivery: { background: "#D1FAE5", color: "#059669" },
  status_update: { background: "#DBEAFE", color: "#1D4ED8" },
  call: { background: "#FEF3C7", color: "#D97706" },
  note: { background: "#F3F4F6", color: "#6B7280" },
  other: { background: "#F0F9FF", color: "#0369A1" },
};

export function badgeStyle(status) {
  return STATUS_BADGE[status] || { background: "#F3F4F6", color: "#6B7280" };
}

export function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
