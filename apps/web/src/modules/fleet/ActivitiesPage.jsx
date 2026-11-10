import { useCallback, useEffect, useRef, useState } from "react";
import Sidebar from "../../components/sidebar";
import { MoonIcon, SearchIcon, SunIcon, TrashIcon, XIcon } from "../../components/icons";
import {
  DARK,
  LIGHT,
  badgeStyle,
  clearWorkspaceId,
  fmtDateTime,
  isWorkspaceAccessError,
  modalTheme,
  readWorkspaceId,
  styles,
  themed,
} from "./shared";
import {
  createActivity,
  deleteActivity,
  listActivities,
  listResource,
  listShipments,
} from "../../utils/fleetApi";

const TYPE_OPTIONS = [
  ["pickup", "Pickup"],
  ["delivery", "Delivery"],
  ["status_update", "Status update"],
  ["call", "Call"],
  ["note", "Note"],
  ["other", "Other"],
];

function linkedEntities(activity, theme) {
  const chips = [];
  if (activity.shipment) {
    chips.push(
      <span key="shipment" style={{ ...styles.badge, ...badgeStyle("status_update") }}>
        {activity.shipment.trackingNo}
      </span>
    );
  }
  if (activity.vehicle) {
    chips.push(
      <span key="vehicle" style={{ ...styles.badge, ...badgeStyle("assigned") }}>
        {activity.vehicle.regNumber}
      </span>
    );
  }
  if (activity.driver) {
    const name = [activity.driver.firstName, activity.driver.lastName]
      .filter(Boolean)
      .join(" ");
    chips.push(
      <span key="driver" style={{ ...styles.badge, ...badgeStyle("on_trip") }}>
        {name}
      </span>
    );
  }
  if (activity.shipper) {
    chips.push(
      <span key="shipper" style={{ ...styles.badge, ...badgeStyle("active") }}>
        {activity.shipper.name}
      </span>
    );
  }
  if (chips.length === 0) {
    return <span style={{ color: theme.muted }}>—</span>;
  }
  return <span style={{ display: "inline-flex", gap: "6px", flexWrap: "wrap" }}>{chips}</span>;
}

export default function ActivitiesPage({
  user,
  onLogout,
  darkMode,
  onToggleDarkMode,
  onOpenProfile,
  getToken,
}) {
  const theme = darkMode ? DARK : LIGHT;

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [lookups, setLookups] = useState({
    shipments: [],
    vehicles: [],
    drivers: [],
    shippers: [],
  });
  const hasLoadedRef = useRef(false);

  const getAuthToken = useCallback(async () => {
    if (!getToken) throw new Error("Auth provider unavailable");
    const token = await getToken();
    if (!token) throw new Error("Missing auth token");
    return token;
  }, [getToken]);

  const fetchActivities = useCallback(
    async (isActive = () => true) => {
      try {
        const token = await getAuthToken();
        const ws = readWorkspaceId() || undefined;
        const query = typeFilter ? { type: typeFilter } : {};
        const data = await listActivities(token, query, ws);
        if (!isActive()) return;
        setActivities(Array.isArray(data) ? data : []);
        setError("");
        hasLoadedRef.current = true;
      } catch (err) {
        if (!isActive()) return;
        if (isWorkspaceAccessError(err)) {
          clearWorkspaceId();
          setMessage("Access denied for the selected workspace — using the default workspace.");
          setReloadKey((key) => key + 1);
          return;
        }
        setError(err.message || "Failed to load activities");
      } finally {
        if (isActive()) setLoading(false);
      }
    },
    [getAuthToken, typeFilter]
  );

  useEffect(() => {
    let active = true;
    const isActive = () => active;
    if (!hasLoadedRef.current) setLoading(true);
    fetchActivities(isActive);
    return () => {
      active = false;
    };
  }, [fetchActivities, reloadKey]);

  // Debounced client-side search (the activities API has no `q` param).
  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setSearchQuery(searchInput.trim().toLowerCase());
    }, 350);
    return () => window.clearTimeout(timerId);
  }, [searchInput]);

  // Lookups for the "log activity" modal.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const token = await getAuthToken();
        const ws = readWorkspaceId() || undefined;
        const [shipments, vehicles, drivers, shippers] = await Promise.all([
          listShipments(token, {}, ws),
          listResource("vehicles")(token, {}, ws),
          listResource("drivers")(token, {}, ws),
          listResource("shippers")(token, {}, ws),
        ]);
        if (!active) return;
        setLookups({
          shipments: Array.isArray(shipments) ? shipments : [],
          vehicles: Array.isArray(vehicles) ? vehicles : [],
          drivers: Array.isArray(drivers) ? drivers : [],
          shippers: Array.isArray(shippers) ? shippers : [],
        });
      } catch {
        // Lookups are optional — logging still works without them.
      }
    })();
    return () => {
      active = false;
    };
  }, [getAuthToken, reloadKey]);

  const visibleActivities = activities.filter((activity) => {
    if (!searchQuery) return true;
    const haystack = [
      activity.title,
      activity.note,
      activity.shipment?.trackingNo,
      activity.vehicle?.regNumber,
      activity.shipper?.name,
      activity.driver?.firstName,
      activity.driver?.lastName,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(searchQuery);
  });

  const handleCreate = async (payload) => {
    const token = await getAuthToken();
    const ws = readWorkspaceId() || undefined;
    await createActivity(token, payload, ws);
    setMessage("Activity logged.");
    setReloadKey((key) => key + 1);
  };

  const handleDelete = async (activity) => {
    if (!window.confirm("Delete this activity?")) return;
    try {
      const token = await getAuthToken();
      const ws = readWorkspaceId() || undefined;
      await deleteActivity(token, activity.id, ws);
      setMessage("Activity deleted.");
      setReloadKey((key) => key + 1);
    } catch (err) {
      setError(
        err.status === 403
          ? "You can only delete your own activities (managers can delete any)."
          : err.message || "Unable to delete activity"
      );
    }
  };

  return (
    <div style={{ ...styles.page, background: theme.pageBg }}>
      <Sidebar
        darkMode={darkMode}
        user={user}
        onLogout={onLogout}
        onOpenProfile={onOpenProfile}
      />

      <div style={styles.mainArea}>
        <header
          style={{
            ...styles.topNav,
            background: theme.navBg,
            borderBottomColor: theme.border,
          }}
        >
          <div style={styles.navLeft}>
            <span style={{ ...styles.pageTitle, color: theme.text }}>Activities</span>
            <div
              style={{
                ...styles.searchWrapper,
                background: theme.searchBg,
                borderColor: theme.border,
              }}
            >
              <span style={styles.searchIcon}>
                <SearchIcon size={14} />
              </span>
              <input
                style={{ ...styles.searchInput, color: theme.text }}
                type="text"
                placeholder="Search activities..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              {searchInput && (
                <button style={styles.clearBtn} onClick={() => setSearchInput("")}>
                  <XIcon size={12} color={theme.muted} />
                </button>
              )}
            </div>
          </div>

          <div style={styles.navRight}>
            <select
              style={{
                ...styles.workspaceSelect,
                background: theme.searchBg,
                borderColor: theme.border,
                color: theme.text,
              }}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              title="Filter by type"
            >
              <option value="">All types</option>
              {TYPE_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            <button style={styles.btnPrimary} onClick={() => setShowNew(true)}>
              + Log Activity
            </button>

            <button
              style={{ ...styles.iconBtn, background: theme.toggleBg }}
              onClick={onToggleDarkMode}
              title={darkMode ? "Light Mode" : "Dark Mode"}
            >
              {darkMode ? <SunIcon size={18} /> : <MoonIcon size={18} />}
            </button>
          </div>
        </header>

        {error && (
          <div style={styles.errorBanner}>
            <span>{error}</span>
            <button style={styles.bannerDismiss} onClick={() => setError("")}>
              <XIcon size={12} color="#B91C1C" />
            </button>
          </div>
        )}
        {message && (
          <div style={styles.successBanner}>
            <span>{message}</span>
            <button style={styles.bannerDismiss} onClick={() => setMessage("")}>
              <XIcon size={12} color="#166534" />
            </button>
          </div>
        )}

        <div style={styles.scrollContent}>
          <div style={styles.toolbar}>
            <div style={{ ...styles.toolbarMeta, color: theme.muted }}>
              {loading
                ? "Loading..."
                : searchQuery
                  ? `${visibleActivities.length} result(s) for "${searchQuery}"`
                  : `${visibleActivities.length} activit${visibleActivities.length === 1 ? "y" : "ies"}`}
            </div>
            <div style={styles.toolbarActions}>
              <button
                style={{
                  ...styles.btnNeutral,
                  borderColor: theme.border,
                  color: theme.text,
                }}
                onClick={() => setReloadKey((key) => key + 1)}
                disabled={loading}
              >
                {loading ? "Syncing..." : "Refresh"}
              </button>
            </div>
          </div>

          <div
            style={{
              ...styles.tableWrap,
              background: theme.cardBg,
              borderColor: theme.border,
            }}
          >
            <table style={styles.table}>
              <thead>
                <tr>
                  {["Type", "Title", "Linked to", "Occurred", "Created by"].map((label) => (
                    <th
                      key={label}
                      style={{
                        ...styles.th,
                        color: theme.muted,
                        background: theme.tableHeadBg,
                        borderBottomColor: theme.border,
                      }}
                    >
                      {label}
                    </th>
                  ))}
                  <th
                    style={{
                      ...styles.th,
                      color: theme.muted,
                      background: theme.tableHeadBg,
                      borderBottomColor: theme.border,
                      textAlign: "right",
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading && activities.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ ...styles.td, color: theme.muted }}>
                      Loading activities...
                    </td>
                  </tr>
                ) : visibleActivities.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        ...styles.td,
                        color: theme.muted,
                        textAlign: "center",
                        padding: "32px",
                      }}
                    >
                      No activities yet — log one
                    </td>
                  </tr>
                ) : (
                  visibleActivities.map((activity) => (
                    <tr key={activity.id} style={{ borderBottomColor: theme.border }}>
                      <td style={{ ...styles.td, borderBottomColor: theme.border }}>
                        <span style={{ ...styles.badge, ...badgeStyle(activity.type) }}>
                          {String(activity.type || "other").replace(/_/g, " ")}
                        </span>
                      </td>
                      <td style={{ ...styles.td, borderBottomColor: theme.border }}>
                        <span style={{ ...styles.cellStrong, color: theme.text }}>
                          {activity.title}
                        </span>
                        {activity.note && (
                          <span
                            style={{
                              ...styles.cellSub,
                              color: theme.muted,
                              display: "block",
                              maxWidth: "320px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {activity.note}
                          </span>
                        )}
                      </td>
                      <td style={{ ...styles.td, borderBottomColor: theme.border }}>
                        {linkedEntities(activity, theme)}
                      </td>
                      <td style={{ ...styles.td, borderBottomColor: theme.border, color: theme.text }}>
                        {fmtDateTime(activity.occurredAt || activity.createdAt) || "—"}
                      </td>
                      <td style={{ ...styles.td, borderBottomColor: theme.border }}>
                        <span
                          style={{
                            ...styles.mono,
                            color: theme.muted,
                            maxWidth: "150px",
                            display: "inline-block",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            verticalAlign: "bottom",
                          }}
                          title={activity.createdBy || ""}
                        >
                          {activity.createdBy || "—"}
                        </span>
                      </td>
                      <td
                        style={{
                          ...styles.td,
                          borderBottomColor: theme.border,
                          textAlign: "right",
                        }}
                      >
                        <div style={styles.rowActions}>
                          <button
                            style={{
                              ...styles.iconAction,
                              borderColor: theme.border,
                              color: "#EF4444",
                            }}
                            title="Delete activity"
                            onClick={() => handleDelete(activity)}
                          >
                            <TrashIcon size={13} color="#EF4444" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showNew && (
        <NewActivityModal
          lookups={lookups}
          darkMode={darkMode}
          onClose={() => setShowNew(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}

// ── Log activity modal ───────────────────────────────────────────────────────

function NewActivityModal({ lookups, darkMode, onClose, onCreate }) {
  const [type, setType] = useState("note");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [occurredAt, setOccurredAt] = useState("");
  const [shipmentId, setShipmentId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [shipperId, setShipperId] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const mt = modalTheme(darkMode);
  const t = themed(mt);

  const handleSubmit = async () => {
    setError("");
    if (!title.trim()) return setError("Title is required.");

    const payload = {
      type,
      title: title.trim(),
      note: note.trim() || null,
      occurredAt: occurredAt || null,
      shipmentId: shipmentId || null,
      vehicleId: vehicleId || null,
      driverId: driverId || null,
      shipperId: shipperId || null,
    };

    setSaving(true);
    try {
      await onCreate(payload);
      onClose();
    } catch (err) {
      setError(err.message || "Unable to log activity");
    } finally {
      setSaving(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !saving) onClose();
  };

  return (
    <div style={styles.backdrop} onClick={handleBackdropClick}>
      <div style={t.modal}>
        <div style={t.modalHeader}>
          <div>
            <div style={t.modalTitle}>Log Activity</div>
            <div style={t.modalSub}>Record a call, pickup, delivery or note</div>
          </div>
          <button style={styles.closeBtn} onClick={onClose} disabled={saving}>
            <XIcon size={14} color="#9CA3AF" />
          </button>
        </div>

        <div style={styles.modalBody}>
          {error && <div style={styles.modalBanner}>{error}</div>}

          <div style={styles.formGrid}>
            <div style={styles.fieldGroup}>
              <label style={t.label}>
                Type <span style={styles.requiredMark}>*</span>
              </label>
              <select style={t.select} value={type} onChange={(e) => setType(e.target.value)}>
                {TYPE_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div style={styles.fieldGroup}>
              <label style={t.label}>Occurred at</label>
              <input
                style={t.input}
                type="datetime-local"
                value={occurredAt}
                onChange={(e) => setOccurredAt(e.target.value)}
              />
            </div>
          </div>

          <div style={styles.fieldGroup}>
            <label style={t.label}>
              Title <span style={styles.requiredMark}>*</span>
            </label>
            <input
              style={t.input}
              type="text"
              placeholder="e.g. Called driver about delay"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={t.label}>Note</label>
            <textarea
              style={t.textarea}
              rows={3}
              placeholder="Additional details..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={t.label}>Linked shipment</label>
            <select
              style={t.select}
              value={shipmentId}
              onChange={(e) => setShipmentId(e.target.value)}
            >
              <option value="">None</option>
              {lookups.shipments.map((shipment) => (
                <option key={shipment.id} value={shipment.id}>
                  {shipment.trackingNo} — {shipment.title}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.formGrid}>
            <div style={styles.fieldGroup}>
              <label style={t.label}>Linked vehicle</label>
              <select
                style={t.select}
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
              >
                <option value="">None</option>
                {lookups.vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.regNumber}
                  </option>
                ))}
              </select>
            </div>
            <div style={styles.fieldGroup}>
              <label style={t.label}>Linked driver</label>
              <select
                style={t.select}
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
              >
                <option value="">None</option>
                {lookups.drivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {[driver.firstName, driver.lastName].filter(Boolean).join(" ")}
                  </option>
                ))}
              </select>
            </div>
            <div style={styles.fieldGroup}>
              <label style={t.label}>Linked shipper</label>
              <select
                style={t.select}
                value={shipperId}
                onChange={(e) => setShipperId(e.target.value)}
              >
                <option value="">None</option>
                {lookups.shippers.map((shipper) => (
                  <option key={shipper.id} value={shipper.id}>
                    {shipper.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div style={t.modalFooter}>
          <div style={styles.modalFooterRight}>
            <button
              style={{ ...styles.btnNeutral, borderColor: mt.inputBorder, color: mt.fieldLabel }}
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button style={styles.btnPrimary} onClick={handleSubmit} disabled={saving}>
              {saving ? "Logging..." : "Log Activity"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
