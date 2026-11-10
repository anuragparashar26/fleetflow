import { useCallback, useEffect, useRef, useState } from "react";
import Sidebar from "../../components/sidebar";
import { MoonIcon, SearchIcon, SunIcon, TrashIcon, XIcon } from "../../components/icons";
import {
  DARK,
  LIGHT,
  badgeStyle,
  clearWorkspaceId,
  fmtDate,
  isWorkspaceAccessError,
  modalTheme,
  orDash,
  readWorkspaceId,
  styles,
  themed,
  toInputDate,
} from "./shared";
import {
  addFuelRecord,
  addServiceRecord,
  createResource,
  deleteResource,
  listResource,
  updateResource,
} from "../../utils/fleetApi";

// ── Small render helpers ─────────────────────────────────────────────────────

function StatusCell({ status, theme }) {
  if (!status) return <span style={{ color: theme.muted }}>—</span>;
  return (
    <span style={{ ...styles.badge, ...badgeStyle(status) }}>
      {String(status).replace(/_/g, " ")}
    </span>
  );
}

function ArrowRoute({ from, to, theme }) {
  return (
    <span style={{ color: theme.text }}>
      {orDash(from)} <span style={{ fontWeight: 700, padding: "0 3px" }}>→</span> {orDash(to)}
    </span>
  );
}

// ── Per-resource configuration ───────────────────────────────────────────────

const CONFIGS = {
  shippers: {
    label: "Shipper",
    empty: "No shippers yet — create one",
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "city", label: "City", type: "text" },
      { name: "industry", label: "Industry", type: "text" },
      { name: "status", label: "Status", type: "select", defaultValue: "active",
        options: [["active", "Active"], ["inactive", "Inactive"]] },
      { name: "contactName", label: "Contact name", type: "text" },
      { name: "contactEmail", label: "Contact email", type: "email" },
      { name: "contactPhone", label: "Contact phone", type: "tel" },
      { name: "notes", label: "Notes", type: "textarea", full: true },
    ],
    columns: [
      { key: "name", label: "Name", render: (row, theme) => (
        <span style={{ ...styles.cellStrong, color: theme.text }}>{row.name}</span>
      ) },
      { key: "city", label: "City", render: (row, theme) => (
        <span style={{ color: theme.text }}>{orDash(row.city)}</span>
      ) },
      { key: "contact", label: "Contact", render: (row, theme) => (
        <span style={{ color: theme.text }}>
          {orDash(row.contactName || row.contactEmail || row.contactPhone)}
          {(row.contactEmail || row.contactPhone) && (
            <span style={{ ...styles.cellSub, color: theme.muted, display: "block" }}>
              {[row.contactEmail, row.contactPhone].filter(Boolean).join(" · ")}
            </span>
          )}
        </span>
      ) },
      { key: "status", label: "Status", render: (row, theme) => (
        <StatusCell status={row.status} theme={theme} />
      ) },
      { key: "shipments", label: "Shipments", render: (row, theme) => (
        <span style={{ color: theme.text }}>{row._count?.shipments ?? 0}</span>
      ) },
    ],
  },

  vehicles: {
    label: "Vehicle",
    empty: "No vehicles yet — create one",
    fields: [
      { name: "regNumber", label: "Registration number", type: "text", required: true },
      { name: "type", label: "Type", type: "select", defaultValue: "truck",
        options: [["truck", "Truck"], ["van", "Van"], ["two_wheeler", "Two wheeler"], ["bus", "Bus"]] },
      { name: "make", label: "Make", type: "text" },
      { name: "model", label: "Model", type: "text" },
      { name: "year", label: "Year", type: "number" },
      { name: "capacityKg", label: "Capacity (kg)", type: "number" },
      { name: "fuelType", label: "Fuel type", type: "select", defaultValue: "diesel",
        options: [["diesel", "Diesel"], ["petrol", "Petrol"], ["cng", "CNG"], ["electric", "Electric"]] },
      { name: "odometerKm", label: "Odometer (km)", type: "number" },
      { name: "status", label: "Status", type: "select", defaultValue: "idle",
        options: [["idle", "Idle"], ["assigned", "Assigned"], ["maintenance", "Maintenance"], ["offline", "Offline"]] },
    ],
    columns: [
      { key: "regNumber", label: "Vehicle", render: (row, theme) => (
        <span style={{ ...styles.cellStrong, color: theme.text }}>{row.regNumber}</span>
      ) },
      { key: "type", label: "Type", render: (row, theme) => (
        <span style={{ color: theme.text }}>{String(row.type || "—").replace(/_/g, " ")}</span>
      ) },
      { key: "makeModel", label: "Make / Model", render: (row, theme) => (
        <span style={{ color: theme.text }}>
          {orDash([row.make, row.model].filter(Boolean).join(" "))}
          {row.year ? <span style={{ color: theme.muted }}> · {row.year}</span> : null}
        </span>
      ) },
      { key: "status", label: "Status", render: (row, theme) => (
        <StatusCell status={row.status} theme={theme} />
      ) },
      { key: "odometerKm", label: "Odometer", render: (row, theme) => (
        <span style={{ color: theme.text }}>{(row.odometerKm ?? 0).toLocaleString("en-IN")} km</span>
      ) },
      { key: "trips", label: "Trips", render: (row, theme) => (
        <span style={{ color: theme.text }}>{row._count?.trips ?? 0}</span>
      ) },
    ],
  },

  drivers: {
    label: "Driver",
    empty: "No drivers yet — create one",
    fields: [
      { name: "firstName", label: "First name", type: "text", required: true },
      { name: "lastName", label: "Last name", type: "text" },
      { name: "email", label: "Email", type: "email" },
      { name: "phone", label: "Phone", type: "tel" },
      { name: "employeeCode", label: "Employee code", type: "text" },
      { name: "licenseNumber", label: "License number", type: "text" },
      { name: "licenseExpiry", label: "License expiry", type: "date" },
      { name: "status", label: "Status", type: "select", defaultValue: "available",
        options: [["available", "Available"], ["on_trip", "On trip"], ["off_duty", "Off duty"], ["inactive", "Inactive"]] },
    ],
    columns: [
      { key: "name", label: "Name", render: (row, theme) => (
        <span style={{ ...styles.cellStrong, color: theme.text }}>
          {[row.firstName, row.lastName].filter(Boolean).join(" ")}
        </span>
      ) },
      { key: "phone", label: "Phone", render: (row, theme) => (
        <span style={{ color: theme.text }}>{orDash(row.phone)}</span>
      ) },
      { key: "license", label: "License", render: (row, theme) => (
        <span style={{ color: theme.text }}>
          {orDash(row.licenseNumber)}
          {row.licenseExpiry && (
            <span style={{ ...styles.cellSub, color: theme.muted, display: "block" }}>
              Expires {fmtDate(row.licenseExpiry)}
            </span>
          )}
        </span>
      ) },
      { key: "status", label: "Status", render: (row, theme) => (
        <StatusCell status={row.status} theme={theme} />
      ) },
      { key: "trips", label: "Trips", render: (row, theme) => (
        <span style={{ color: theme.text }}>{row._count?.trips ?? 0}</span>
      ) },
    ],
  },

  routes: {
    label: "Route",
    empty: "No routes yet — create one",
    hasStops: true,
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "status", label: "Status", type: "select", defaultValue: "active",
        options: [["active", "Active"], ["inactive", "Inactive"]] },
      { name: "originCity", label: "Origin city", type: "text" },
      { name: "destinationCity", label: "Destination city", type: "text" },
      { name: "distanceKm", label: "Distance (km)", type: "number" },
      { name: "estimatedMinutes", label: "Estimated minutes", type: "number" },
      { name: "stops", label: "Stops", type: "stops", full: true },
    ],
    columns: [
      { key: "name", label: "Name", render: (row, theme) => (
        <span style={{ ...styles.cellStrong, color: theme.text }}>{row.name}</span>
      ) },
      { key: "route", label: "Route", render: (row, theme) => (
        <ArrowRoute from={row.originCity} to={row.destinationCity} theme={theme} />
      ) },
      { key: "distanceKm", label: "Distance", render: (row, theme) => (
        <span style={{ color: theme.text }}>
          {row.distanceKm != null ? `${row.distanceKm} km` : "—"}
        </span>
      ) },
      { key: "stops", label: "Stops", render: (row, theme) => (
        <span style={{ color: theme.text }}>{row.stops?.length ?? 0}</span>
      ) },
      { key: "trips", label: "Trips", render: (row, theme) => (
        <span style={{ color: theme.text }}>{row._count?.trips ?? 0}</span>
      ) },
    ],
  },

  trips: {
    label: "Trip",
    empty: "No trips yet — create one",
    needsLookups: true,
    fields: [
      { name: "origin", label: "Origin", type: "text", required: true },
      { name: "destination", label: "Destination", type: "text", required: true },
      { name: "vehicleId", label: "Vehicle", type: "lookup", required: true, lookupKey: "vehicles",
        optionLabel: (row) => row.regNumber },
      { name: "driverId", label: "Driver", type: "lookup", required: true, lookupKey: "drivers",
        optionLabel: (row) => [row.firstName, row.lastName].filter(Boolean).join(" ") },
      { name: "routeId", label: "Route", type: "lookup", lookupKey: "routes",
        optionLabel: (row) => row.name },
      { name: "status", label: "Status", type: "select", defaultValue: "planned",
        options: [["planned", "Planned"], ["in_transit", "In transit"], ["completed", "Completed"], ["cancelled", "Cancelled"]] },
      { name: "distanceKm", label: "Distance (km)", type: "number" },
      { name: "notes", label: "Notes", type: "textarea", full: true },
    ],
    columns: [
      { key: "route", label: "Route", render: (row, theme) => (
        <ArrowRoute from={row.origin} to={row.destination} theme={theme} />
      ) },
      { key: "vehicle", label: "Vehicle", render: (row, theme) => (
        <span style={{ color: theme.text }}>{orDash(row.vehicle?.regNumber)}</span>
      ) },
      { key: "driver", label: "Driver", render: (row, theme) => (
        <span style={{ color: theme.text }}>
          {orDash([row.driver?.firstName, row.driver?.lastName].filter(Boolean).join(" "))}
        </span>
      ) },
      { key: "status", label: "Status", render: (row, theme) => (
        <StatusCell status={row.status} theme={theme} />
      ) },
      { key: "dates", label: "Dates", render: (row, theme) => (
        <span style={{ color: theme.text }}>
          {row.startedAt
            ? `Started ${fmtDate(row.startedAt)}`
            : `Created ${fmtDate(row.createdAt)}`}
          {row.completedAt && (
            <span style={{ ...styles.cellSub, color: theme.muted, display: "block" }}>
              Completed {fmtDate(row.completedAt)}
            </span>
          )}
        </span>
      ) },
    ],
  },
};

// ── Create / edit form modal ─────────────────────────────────────────────────

function buildInitialValues(config, initial) {
  const values = {};
  config.fields.forEach((field) => {
    if (field.type === "stops") return;
    const raw = initial ? initial[field.name] : (field.defaultValue ?? "");
    if (field.type === "date") values[field.name] = toInputDate(raw);
    else if (raw === null || raw === undefined) values[field.name] = "";
    else values[field.name] = String(raw);
  });
  return values;
}

function ResourceFormModal({ config, initial, lookups, darkMode, onClose, onSubmit }) {
  const [values, setValues] = useState(() => buildInitialValues(config, initial));
  const [stops, setStops] = useState(() =>
    config.hasStops
      ? (initial?.stops || []).map((stop) => ({
          name: stop.name || "",
          city: stop.city || "",
          stopType: stop.stopType || "delivery",
        }))
      : []
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const mt = modalTheme(darkMode);
  const t = themed(mt);
  const isEdit = Boolean(initial);

  const setField = (name, value) => setValues((prev) => ({ ...prev, [name]: value }));

  const buildPayload = () => {
    const payload = {};

    for (const field of config.fields) {
      if (field.type === "stops") continue;
      const value = values[field.name] ?? "";

      if (field.type === "number") {
        if (value === "") continue; // leave untouched / use backend default
        const parsed = Number(value);
        if (Number.isNaN(parsed)) throw new Error(`${field.label} must be a number.`);
        payload[field.name] = parsed;
        continue;
      }

      if (field.type === "select") {
        const selected = String(value || field.defaultValue || "");
        if (!selected) continue; // never send null for enum columns
        payload[field.name] = selected;
        continue;
      }

      if (field.type === "date") {
        payload[field.name] = value || null;
        continue;
      }

      const trimmed = String(value).trim();
      if (field.required && !trimmed) throw new Error(`${field.label} is required.`);
      payload[field.name] = trimmed || null;
    }

    if (config.hasStops) {
      payload.stops = stops
        .filter((stop) => stop.name.trim())
        .map((stop) => ({
          name: stop.name.trim(),
          city: stop.city.trim() || null,
          stopType: stop.stopType || "delivery",
        }));
    }

    return payload;
  };

  const handleSubmit = async () => {
    setError("");
    let payload;
    try {
      payload = buildPayload();
    } catch (err) {
      setError(err.message || "Please fix the highlighted fields.");
      return;
    }

    setSaving(true);
    try {
      await onSubmit(payload);
      onClose();
    } catch (err) {
      setError(err.message || "Unable to save");
    } finally {
      setSaving(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !saving) onClose();
  };

  const renderField = (field) => {
    const fieldStyle = field.full ? { ...styles.fieldGroup, ...styles.formGridFull } : styles.fieldGroup;

    if (field.type === "stops") {
      return (
        <div key={field.name} style={fieldStyle}>
          <label style={t.label}>{field.label}</label>
          {stops.map((stop, index) => (
            <div key={`stop-${index}`} style={styles.stopRow}>
              <input
                style={{ ...t.input, flex: 2 }}
                type="text"
                placeholder="Stop name *"
                value={stop.name}
                onChange={(e) =>
                  setStops((prev) =>
                    prev.map((s, i) => (i === index ? { ...s, name: e.target.value } : s))
                  )
                }
              />
              <input
                style={{ ...t.input, flex: 1 }}
                type="text"
                placeholder="City"
                value={stop.city}
                onChange={(e) =>
                  setStops((prev) =>
                    prev.map((s, i) => (i === index ? { ...s, city: e.target.value } : s))
                  )
                }
              />
              <select
                style={{ ...t.select, flex: 1, maxWidth: "140px" }}
                value={stop.stopType}
                onChange={(e) =>
                  setStops((prev) =>
                    prev.map((s, i) => (i === index ? { ...s, stopType: e.target.value } : s))
                  )
                }
              >
                <option value="pickup">Pickup</option>
                <option value="delivery">Delivery</option>
                <option value="hub">Hub</option>
              </select>
              <button
                style={{ ...styles.iconAction, borderColor: mt.inputBorder, color: "#EF4444" }}
                onClick={() => setStops((prev) => prev.filter((_, i) => i !== index))}
                title="Remove stop"
              >
                <TrashIcon size={13} color="#EF4444" />
              </button>
            </div>
          ))}
          <button
            style={{ ...styles.btnSmall, borderColor: mt.inputBorder, color: mt.fieldLabel }}
            onClick={() =>
              setStops((prev) => [...prev, { name: "", city: "", stopType: "delivery" }])
            }
          >
            + Add stop
          </button>
        </div>
      );
    }

    if (field.type === "select" || field.type === "lookup") {
      const options =
        field.type === "lookup"
          ? (lookups?.[field.lookupKey] || []).map((row) => [row.id, field.optionLabel(row)])
          : field.options;
      return (
        <div key={field.name} style={fieldStyle}>
          <label style={t.label}>
            {field.label} {field.required && <span style={styles.requiredMark}>*</span>}
          </label>
          <select
            style={t.select}
            value={values[field.name] ?? ""}
            onChange={(e) => setField(field.name, e.target.value)}
          >
            <option value="">{field.required ? "Select..." : "None"}</option>
            {options.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (field.type === "textarea") {
      return (
        <div key={field.name} style={fieldStyle}>
          <label style={t.label}>
            {field.label} {field.required && <span style={styles.requiredMark}>*</span>}
          </label>
          <textarea
            style={t.textarea}
            rows={3}
            value={values[field.name] ?? ""}
            onChange={(e) => setField(field.name, e.target.value)}
          />
        </div>
      );
    }

    return (
      <div key={field.name} style={fieldStyle}>
        <label style={t.label}>
          {field.label} {field.required && <span style={styles.requiredMark}>*</span>}
        </label>
        <input
          style={t.input}
          type={field.type === "number" ? "number" : field.type === "date" ? "date" : field.type}
          value={values[field.name] ?? ""}
          onChange={(e) => setField(field.name, e.target.value)}
        />
      </div>
    );
  };

  return (
    <div style={styles.backdrop} onClick={handleBackdropClick}>
      <div style={{ ...t.modal, ...styles.modalWide }}>
        <div style={t.modalHeader}>
          <div>
            <div style={t.modalTitle}>
              {isEdit ? `Edit ${config.label}` : `New ${config.label}`}
            </div>
            <div style={t.modalSub}>
              {isEdit ? "Update this record" : `Create a new ${config.label.toLowerCase()}`}
            </div>
          </div>
          <button style={styles.closeBtn} onClick={onClose} disabled={saving}>
            <XIcon size={14} color="#9CA3AF" />
          </button>
        </div>

        <div style={styles.modalBody}>
          {error && <div style={styles.modalBanner}>{error}</div>}
          <div style={styles.formGrid}>{config.fields.map(renderField)}</div>
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
              {saving ? "Saving..." : isEdit ? "Save Changes" : `Create ${config.label}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Vehicle quick action modal (fuel log / service record) ──────────────────

const FUEL_FIELDS = [
  { name: "liters", label: "Liters", type: "number", required: true },
  { name: "amount", label: "Amount (₹)", type: "number", required: true },
  { name: "odometerKm", label: "Odometer (km)", type: "number" },
  { name: "station", label: "Station", type: "text" },
];

const SERVICE_FIELDS = [
  { name: "serviceTypeName", label: "Service type", type: "text", required: true },
  { name: "startDate", label: "Start date", type: "date", required: true },
  { name: "endDate", label: "End date", type: "date" },
  { name: "cost", label: "Cost (₹)", type: "number" },
  { name: "odometerKm", label: "Odometer (km)", type: "number" },
  { name: "notes", label: "Notes", type: "textarea", full: true },
];

function VehicleActionModal({ type, vehicle, darkMode, onClose, onSubmit }) {
  const fields = type === "fuel" ? FUEL_FIELDS : SERVICE_FIELDS;
  const title = type === "fuel" ? "Log Fuel" : "Log Service";
  const [values, setValues] = useState({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const mt = modalTheme(darkMode);
  const t = themed(mt);

  const handleSubmit = async () => {
    setError("");
    const payload = {};
    try {
      fields.forEach((field) => {
        const value = values[field.name] ?? "";
        if (field.type === "number") {
          if (value === "") return;
          const parsed = Number(value);
          if (Number.isNaN(parsed)) throw new Error(`${field.label} must be a number.`);
          payload[field.name] = parsed;
          return;
        }
        const trimmed = String(value).trim();
        if (field.required && !trimmed) throw new Error(`${field.label} is required.`);
        if (trimmed) payload[field.name] = trimmed;
      });
    } catch (err) {
      setError(err.message || "Please fix the highlighted fields.");
      return;
    }

    setSaving(true);
    try {
      await onSubmit(payload);
      onClose();
    } catch (err) {
      setError(err.message || "Unable to save record");
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
            <div style={t.modalTitle}>{title}</div>
            <div style={t.modalSub}>{vehicle?.regNumber}</div>
          </div>
          <button style={styles.closeBtn} onClick={onClose} disabled={saving}>
            <XIcon size={14} color="#9CA3AF" />
          </button>
        </div>

        <div style={styles.modalBody}>
          {error && <div style={styles.modalBanner}>{error}</div>}
          <div style={styles.formGrid}>
            {fields.map((field) => {
              const fieldStyle = field.full
                ? { ...styles.fieldGroup, ...styles.formGridFull }
                : styles.fieldGroup;
              if (field.type === "textarea") {
                return (
                  <div key={field.name} style={fieldStyle}>
                    <label style={t.label}>{field.label}</label>
                    <textarea
                      style={t.textarea}
                      rows={3}
                      value={values[field.name] ?? ""}
                      onChange={(e) =>
                        setValues((prev) => ({ ...prev, [field.name]: e.target.value }))
                      }
                    />
                  </div>
                );
              }
              return (
                <div key={field.name} style={fieldStyle}>
                  <label style={t.label}>
                    {field.label}{" "}
                    {field.required && <span style={styles.requiredMark}>*</span>}
                  </label>
                  <input
                    style={t.input}
                    type={field.type === "date" ? "date" : field.type}
                    value={values[field.name] ?? ""}
                    onChange={(e) =>
                      setValues((prev) => ({ ...prev, [field.name]: e.target.value }))
                    }
                  />
                </div>
              );
            })}
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
              {saving ? "Saving..." : "Save Record"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function DirectoryPage({
  resource,
  title,
  user,
  onLogout,
  darkMode,
  onToggleDarkMode,
  onOpenProfile,
  getToken,
}) {
  const theme = darkMode ? DARK : LIGHT;
  const config = CONFIGS[resource] || CONFIGS.shippers;

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [formState, setFormState] = useState(null); // { mode: "create" | "edit", row? }
  const [actionState, setActionState] = useState(null); // { type: "fuel" | "service", row }
  const [lookups, setLookups] = useState({ vehicles: [], drivers: [], routes: [] });
  const [reloadKey, setReloadKey] = useState(0);
  const hasLoadedRef = useRef(false);

  const getAuthToken = useCallback(async () => {
    if (!getToken) throw new Error("Auth provider unavailable");
    const token = await getToken();
    if (!token) throw new Error("Missing auth token");
    return token;
  }, [getToken]);

  // Reset everything when the routed resource changes (components can persist
  // across route updates since the same component type is reused).
  useEffect(() => {
    setRows([]);
    setSearchInput("");
    setQuery("");
    setError("");
    setMessage("");
    setFormState(null);
    setActionState(null);
    hasLoadedRef.current = false;
    setLoading(true);
  }, [resource]);

  const fetchRows = useCallback(
    async (isActive = () => true) => {
      try {
        const token = await getAuthToken();
        const ws = readWorkspaceId() || undefined;
        const data = await listResource(resource)(token, query ? { q: query } : {}, ws);
        if (!isActive()) return;
        setRows(Array.isArray(data) ? data : []);
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
        setError(err.message || "Failed to load data");
      } finally {
        if (isActive()) setLoading(false);
      }
    },
    [getAuthToken, query, resource]
  );

  useEffect(() => {
    let active = true;
    const isActive = () => active;
    if (!hasLoadedRef.current) setLoading(true);
    fetchRows(isActive);
    return () => {
      active = false;
    };
  }, [fetchRows, reloadKey]);

  // Debounced search → server-side `q` param.
  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setQuery(searchInput.trim());
    }, 350);
    return () => window.clearTimeout(timerId);
  }, [searchInput]);

  // Lookups needed by the trips form.
  useEffect(() => {
    if (resource !== "trips") return undefined;
    let active = true;
    (async () => {
      try {
        const token = await getAuthToken();
        const ws = readWorkspaceId() || undefined;
        const [vehicles, drivers, routes] = await Promise.all([
          listResource("vehicles")(token, {}, ws),
          listResource("drivers")(token, {}, ws),
          listResource("routes")(token, {}, ws),
        ]);
        if (!active) return;
        setLookups({
          vehicles: Array.isArray(vehicles) ? vehicles : [],
          drivers: Array.isArray(drivers) ? drivers : [],
          routes: Array.isArray(routes) ? routes : [],
        });
      } catch {
        // Lookups are optional — the form still opens without them.
      }
    })();
    return () => {
      active = false;
    };
  }, [getAuthToken, reloadKey, resource]);

  const refresh = useCallback(() => {
    setReloadKey((key) => key + 1);
  }, []);

  const handleCreate = async (payload) => {
    const token = await getAuthToken();
    const ws = readWorkspaceId() || undefined;
    await createResource(resource)(token, payload, ws);
    setMessage(`${config.label} created.`);
    refresh();
  };

  const handleUpdate = async (row, payload) => {
    const token = await getAuthToken();
    const ws = readWorkspaceId() || undefined;
    await updateResource(resource)(token, row.id, payload, ws);
    setMessage(`${config.label} updated.`);
    refresh();
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete this ${config.label.toLowerCase()}?`)) return;
    try {
      const token = await getAuthToken();
      const ws = readWorkspaceId() || undefined;
      await deleteResource(resource)(token, row.id, ws);
      setMessage(`${config.label} deleted.`);
      refresh();
    } catch (err) {
      setError(
        err.status === 403
          ? "You don't have permission to delete this record (managers only)."
          : err.message || "Unable to delete"
      );
    }
  };

  const handleTripStatus = async (row, status) => {
    try {
      const token = await getAuthToken();
      const ws = readWorkspaceId() || undefined;
      await updateResource("trips")(token, row.id, { status }, ws);
      setMessage(`Trip marked ${status.replace("_", " ")}.`);
      refresh();
    } catch (err) {
      setError(err.message || "Unable to update trip status");
    }
  };

  const handleVehicleAction = async (payload) => {
    const token = await getAuthToken();
    const ws = readWorkspaceId() || undefined;
    if (actionState.type === "fuel") {
      await addFuelRecord(token, actionState.row.id, payload, ws);
      setMessage("Fuel record saved.");
    } else {
      await addServiceRecord(token, actionState.row.id, payload, ws);
      setMessage("Service record saved.");
    }
    refresh();
  };

  const renderRowActions = (row) => (
    <div style={styles.rowActions}>
      {resource === "vehicles" && (
        <>
          <button
            style={{ ...styles.btnSmall, borderColor: "#BFDBFE", color: "#1D4ED8" }}
            onClick={() => setActionState({ type: "fuel", row })}
          >
            Log fuel
          </button>
          <button
            style={{ ...styles.btnSmall, borderColor: "#FDE68A", color: "#B45309" }}
            onClick={() => setActionState({ type: "service", row })}
          >
            Service
          </button>
        </>
      )}
      {resource === "trips" && row.status === "planned" && (
        <button
          style={{ ...styles.btnSmall, borderColor: "#A7F3D0", color: "#047857" }}
          onClick={() => handleTripStatus(row, "in_transit")}
        >
          Start
        </button>
      )}
      {resource === "trips" && row.status === "in_transit" && (
        <button
          style={{ ...styles.btnSmall, borderColor: "#A7F3D0", color: "#047857" }}
          onClick={() => handleTripStatus(row, "completed")}
        >
          Complete
        </button>
      )}
      <button
        style={{
          ...styles.iconAction,
          borderColor: theme.border,
          color: theme.text,
        }}
        title="Edit"
        onClick={() => setFormState({ mode: "edit", row })}
      >
        ✎
      </button>
      <button
        style={{
          ...styles.iconAction,
          borderColor: theme.border,
          color: "#EF4444",
        }}
        title="Delete"
        onClick={() => handleDelete(row)}
      >
        <TrashIcon size={13} color="#EF4444" />
      </button>
    </div>
  );

  const columnCount = config.columns.length + 1;

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
            <span style={{ ...styles.pageTitle, color: theme.text }}>{title}</span>
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
                placeholder={`Search ${String(title).toLowerCase()}...`}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setQuery(searchInput.trim());
                }}
              />
              {searchInput && (
                <button style={styles.clearBtn} onClick={() => setSearchInput("")}>
                  <XIcon size={12} color={theme.muted} />
                </button>
              )}
            </div>
          </div>

          <div style={styles.navRight}>
            <button style={styles.btnPrimary} onClick={() => setFormState({ mode: "create" })}>
              + New {config.label}
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
                : query
                  ? `${rows.length} result(s) for "${query}"`
                  : `${rows.length} record(s)`}
            </div>
            <div style={styles.toolbarActions}>
              <button
                style={{
                  ...styles.btnNeutral,
                  borderColor: theme.border,
                  color: theme.text,
                }}
                onClick={() => fetchRows()}
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
                  {config.columns.map((column) => (
                    <th
                      key={column.key}
                      style={{
                        ...styles.th,
                        color: theme.muted,
                        background: theme.tableHeadBg,
                        borderBottomColor: theme.border,
                      }}
                    >
                      {column.label}
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
                {loading && rows.length === 0 ? (
                  <tr>
                    <td colSpan={columnCount} style={{ ...styles.td, color: theme.muted }}>
                      Loading {String(title).toLowerCase()}...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columnCount}
                      style={{ ...styles.td, color: theme.muted, textAlign: "center", padding: "32px" }}
                    >
                      {query
                        ? `No matches for "${query}"`
                        : config.empty}
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id} style={{ borderBottomColor: theme.border }}>
                      {config.columns.map((column) => (
                        <td key={column.key} style={{ ...styles.td, borderBottomColor: theme.border }}>
                          {column.render
                            ? column.render(row, theme)
                            : <span style={{ color: theme.text }}>{orDash(row[column.key])}</span>}
                        </td>
                      ))}
                      <td
                        style={{
                          ...styles.td,
                          borderBottomColor: theme.border,
                          textAlign: "right",
                        }}
                      >
                        {renderRowActions(row)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {formState && (
        <ResourceFormModal
          config={config}
          initial={formState.mode === "edit" ? formState.row : null}
          lookups={lookups}
          darkMode={darkMode}
          onClose={() => setFormState(null)}
          onSubmit={(payload) =>
            formState.mode === "edit"
              ? handleUpdate(formState.row, payload)
              : handleCreate(payload)
          }
        />
      )}

      {actionState && (
        <VehicleActionModal
          type={actionState.type}
          vehicle={actionState.row}
          darkMode={darkMode}
          onClose={() => setActionState(null)}
          onSubmit={handleVehicleAction}
        />
      )}
    </div>
  );
}
