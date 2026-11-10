import { useState } from "react";
import { XIcon } from "../../components/icons";
import { modalTheme, styles, themed } from "./shared";

const PRIORITY_OPTIONS = ["low", "normal", "high", "urgent"];

export default function NewShipmentModal({
  shippers = [],
  drivers = [],
  onClose,
  onCreate,
  darkMode = false,
}) {
  const [title, setTitle] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [description, setDescription] = useState("");
  const [shipperId, setShipperId] = useState("");
  const [priority, setPriority] = useState("normal");
  const [pickupAt, setPickupAt] = useState("");
  const [deliveryDueAt, setDeliveryDueAt] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [declaredValue, setDeclaredValue] = useState("");
  const [driverIds, setDriverIds] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const mt = modalTheme(darkMode);
  const t = themed(mt);

  const toggleDriver = (driverId) => {
    setDriverIds((prev) =>
      prev.includes(driverId) ? prev.filter((id) => id !== driverId) : [...prev, driverId]
    );
  };

  const handleCreate = async () => {
    setError("");

    if (!title.trim()) return setError("Title is required.");
    if (!origin.trim()) return setError("Origin is required.");
    if (!destination.trim()) return setError("Destination is required.");

    const payload = {
      title: title.trim(),
      origin: origin.trim(),
      destination: destination.trim(),
      description: description.trim() || null,
      shipperId: shipperId || null,
      priority,
      pickupAt: pickupAt || null,
      deliveryDueAt: deliveryDueAt || null,
      weightKg: weightKg === "" ? null : Number(weightKg),
      declaredValue: declaredValue === "" ? null : Number(declaredValue),
      driverIds,
    };

    setSaving(true);
    try {
      await onCreate(payload);
      onClose();
    } catch (err) {
      setError(err.message || "Unable to create shipment");
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
            <div style={t.modalTitle}>New Shipment</div>
            <div style={t.modalSub}>Book a shipment onto the fleet board</div>
          </div>
          <button style={styles.closeBtn} onClick={onClose} disabled={saving}>
            <XIcon size={14} color="#9CA3AF" />
          </button>
        </div>

        <div style={styles.modalBody}>
          {error && <div style={styles.modalBanner}>{error}</div>}

          <div style={styles.fieldGroup}>
            <label style={t.label}>
              Title <span style={styles.requiredMark}>*</span>
            </label>
            <input
              style={t.input}
              type="text"
              placeholder="e.g. 12 pallets to Pune DC"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div style={styles.formGrid}>
            <div style={styles.fieldGroup}>
              <label style={t.label}>
                Origin <span style={styles.requiredMark}>*</span>
              </label>
              <input
                style={t.input}
                type="text"
                placeholder="Mumbai"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
              />
            </div>
            <div style={styles.fieldGroup}>
              <label style={t.label}>
                Destination <span style={styles.requiredMark}>*</span>
              </label>
              <input
                style={t.input}
                type="text"
                placeholder="Pune"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
            </div>
          </div>

          <div style={styles.fieldGroup}>
            <label style={t.label}>Description</label>
            <textarea
              style={t.textarea}
              rows={3}
              placeholder="Handling instructions, contents, notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div style={styles.formGrid}>
            <div style={styles.fieldGroup}>
              <label style={t.label}>Shipper</label>
              <select
                style={t.select}
                value={shipperId}
                onChange={(e) => setShipperId(e.target.value)}
              >
                <option value="">No shipper</option>
                {shippers.map((shipper) => (
                  <option key={shipper.id} value={shipper.id}>
                    {shipper.name}
                  </option>
                ))}
              </select>
            </div>
            <div style={styles.fieldGroup}>
              <label style={t.label}>Priority</label>
              <select
                style={t.select}
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                {PRIORITY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div style={styles.fieldGroup}>
              <label style={t.label}>Pickup</label>
              <input
                style={t.input}
                type="datetime-local"
                value={pickupAt}
                onChange={(e) => setPickupAt(e.target.value)}
              />
            </div>
            <div style={styles.fieldGroup}>
              <label style={t.label}>Delivery due</label>
              <input
                style={t.input}
                type="datetime-local"
                value={deliveryDueAt}
                onChange={(e) => setDeliveryDueAt(e.target.value)}
              />
            </div>
            <div style={styles.fieldGroup}>
              <label style={t.label}>Weight (kg)</label>
              <input
                style={t.input}
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
              />
            </div>
            <div style={styles.fieldGroup}>
              <label style={t.label}>Declared value (₹)</label>
              <input
                style={t.input}
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                value={declaredValue}
                onChange={(e) => setDeclaredValue(e.target.value)}
              />
            </div>
          </div>

          <div style={styles.fieldGroup}>
            <label style={t.label}>
              Assigned drivers {driverIds.length > 0 && `(${driverIds.length} selected)`}
            </label>
            {drivers.length === 0 ? (
              <div style={t.muted}>No drivers yet — add drivers from the Drivers page first.</div>
            ) : (
              <div style={t.checkGrid}>
                {drivers.map((driver) => {
                  const name = [driver.firstName, driver.lastName].filter(Boolean).join(" ");
                  return (
                    <label key={driver.id} style={t.checkItem}>
                      <input
                        type="checkbox"
                        checked={driverIds.includes(driver.id)}
                        onChange={() => toggleDriver(driver.id)}
                      />
                      {name}
                    </label>
                  );
                })}
              </div>
            )}
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
            <button style={styles.btnPrimary} onClick={handleCreate} disabled={saving}>
              {saving ? "Creating..." : "Create Shipment"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
