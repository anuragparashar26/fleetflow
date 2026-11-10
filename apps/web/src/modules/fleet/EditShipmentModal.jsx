import { useCallback, useEffect, useState } from "react";
import { TrashIcon, XIcon } from "../../components/icons";
import {
  fmtDateTime,
  modalTheme,
  styles,
  themed,
  toInputDateTime,
} from "./shared";

const PRIORITY_OPTIONS = ["low", "normal", "high", "urgent"];

function normalizeItem(item) {
  return {
    description: String(item.description || "").trim() || "Item",
    quantity: Number(item.quantity) || 1,
    weightKg:
      item.weightKg === "" || item.weightKg === null || item.weightKg === undefined
        ? null
        : Number(item.weightKg),
  };
}

function sameIdSet(a, b) {
  if (a.length !== b.length) return false;
  const left = [...a].sort().join("|");
  const right = [...b].sort().join("|");
  return left === right;
}

export default function EditShipmentModal({
  shippers = [],
  drivers = [],
  darkMode = false,
  onClose,
  onFetch,
  onSave,
  onDelete,
  onAddComment,
}) {
  const [form, setForm] = useState(null);
  const [detail, setDetail] = useState(null);
  const [initial, setInitial] = useState(null);
  const [items, setItems] = useState([]);
  const [labelsText, setLabelsText] = useState("");
  const [driverIds, setDriverIds] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [commentBusy, setCommentBusy] = useState(false);

  const mt = modalTheme(darkMode);
  const t = themed(mt);

  const load = useCallback(async () => {
    setError("");
    try {
      const data = await onFetch();
      if (!data) return;
      const snapshot = {
        trackingNo: data.trackingNo || "",
        title: data.title || "",
        description: data.description || "",
        origin: data.origin || "",
        destination: data.destination || "",
        priority: data.priority || "normal",
        shipperId: data.shipperId || "",
        pickupAt: toInputDateTime(data.pickupAt),
        deliveryDueAt: toInputDateTime(data.deliveryDueAt),
        weightKg: data.weightKg === null || data.weightKg === undefined ? "" : String(data.weightKg),
        declaredValue:
          data.declaredValue === null || data.declaredValue === undefined
            ? ""
            : String(data.declaredValue),
      };
      const serverItems = (data.items || []).map((item) => ({
        description: item.description || "",
        quantity: String(item.quantity ?? 1),
        weightKg:
          item.weightKg === null || item.weightKg === undefined ? "" : String(item.weightKg),
      }));
      const labelNames = (data.labels || [])
        .map((entry) => entry?.label?.name)
        .filter(Boolean);
      const assignedDriverIds = (data.drivers || [])
        .map((entry) => entry?.driver?.id)
        .filter(Boolean);

      setDetail(data);
      setForm(snapshot);
      setInitial({
        snapshot,
        items: serverItems.map(normalizeItem),
        labelNames,
        driverIds: assignedDriverIds,
      });
      setItems(serverItems);
      setLabelsText(labelNames.join(", "));
      setDriverIds(assignedDriverIds);
    } catch (err) {
      setError(err.message || "Unable to load shipment details");
    }
  }, [onFetch]);

  useEffect(() => {
    load();
  }, [load]);

  const setField = (key, value) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSave = async () => {
    if (!form || !initial) return;
    setError("");
    setMessage("");

    if (!form.title.trim()) return setError("Title is required.");
    if (!form.origin.trim()) return setError("Origin is required.");
    if (!form.destination.trim()) return setError("Destination is required.");

    const payload = {};
    const setIf = (key, next, prev) => {
      if (next !== prev) payload[key] = next;
    };

    setIf("title", form.title.trim(), initial.snapshot.title.trim());
    setIf(
      "description",
      form.description.trim() || null,
      initial.snapshot.description.trim() || null
    );
    setIf("origin", form.origin.trim(), initial.snapshot.origin.trim());
    setIf("destination", form.destination.trim(), initial.snapshot.destination.trim());
    setIf("priority", form.priority, initial.snapshot.priority);
    setIf("shipperId", form.shipperId || null, initial.snapshot.shipperId || null);
    setIf("pickupAt", form.pickupAt || null, initial.snapshot.pickupAt || null);
    setIf(
      "deliveryDueAt",
      form.deliveryDueAt || null,
      initial.snapshot.deliveryDueAt || null
    );
    setIf(
      "weightKg",
      form.weightKg === "" ? null : Number(form.weightKg),
      initial.snapshot.weightKg === "" ? null : Number(initial.snapshot.weightKg)
    );
    setIf(
      "declaredValue",
      form.declaredValue === "" ? null : Number(form.declaredValue),
      initial.snapshot.declaredValue === ""
        ? null
        : Number(initial.snapshot.declaredValue)
    );

    const nextItems = items.map(normalizeItem);
    if (JSON.stringify(nextItems) !== JSON.stringify(initial.items)) {
      payload.items = nextItems;
    }

    const nextLabels = labelsText
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean);
    if (
      nextLabels.length !== initial.labelNames.length ||
      nextLabels.some((name, index) => name !== initial.labelNames[index])
    ) {
      payload.labelNames = nextLabels;
    }

    if (!sameIdSet(driverIds, initial.driverIds)) {
      payload.driverIds = driverIds;
    }

    if (Object.keys(payload).length === 0) {
      setMessage("No changes to save.");
      return;
    }

    setSaving(true);
    try {
      await onSave(payload);
      setMessage("Shipment updated.");
      await load();
    } catch (err) {
      setError(err.message || "Unable to save shipment");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this shipment? This cannot be undone.")) return;
    setDeleting(true);
    setError("");
    setMessage("");
    try {
      await onDelete();
      onClose();
    } catch (err) {
      setError(err.message || "Unable to delete shipment");
    } finally {
      setDeleting(false);
    }
  };

  const handleAddComment = async () => {
    const body = newComment.trim();
    if (!body) return;
    setCommentBusy(true);
    setError("");
    try {
      await onAddComment(body);
      setNewComment("");
      await load();
    } catch (err) {
      setError(err.message || "Unable to add comment");
    } finally {
      setCommentBusy(false);
    }
  };

  const updateItem = (index, key, value) => {
    setItems((prev) =>
      prev.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item))
    );
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !saving && !deleting) onClose();
  };

  return (
    <div style={styles.backdrop} onClick={handleBackdropClick}>
      <div style={{ ...t.modal, ...styles.modalWide }}>
        <div style={t.modalHeader}>
          <div>
            <div style={t.modalTitle}>Edit Shipment</div>
            <div style={t.modalSub}>
              {form?.trackingNo ? `Tracking ${form.trackingNo}` : "Loading tracking number..."}
            </div>
          </div>
          <button style={styles.closeBtn} onClick={onClose} disabled={saving || deleting}>
            <XIcon size={14} color="#9CA3AF" />
          </button>
        </div>

        <div style={styles.modalBody}>
          {error && <div style={styles.modalBanner}>{error}</div>}
          {message && <div style={styles.modalSuccess}>{message}</div>}

          {!form ? (
            <div style={{ ...styles.mutedText, color: mt.sub, padding: "30px 0", textAlign: "center" }}>
              {error ? "Unable to load shipment details." : "Loading shipment..."}
            </div>
          ) : (
            <>
              {/* ── (a) Editable fields ── */}
              <div style={styles.fieldGroup}>
                <label style={t.label}>Tracking number</label>
                <input
                  style={{ ...t.input, color: mt.sub, background: mt.rowBg }}
                  type="text"
                  value={form.trackingNo}
                  readOnly
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={t.label}>
                  Title <span style={styles.requiredMark}>*</span>
                </label>
                <input
                  style={t.input}
                  type="text"
                  value={form.title}
                  onChange={(e) => setField("title", e.target.value)}
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
                    value={form.origin}
                    onChange={(e) => setField("origin", e.target.value)}
                  />
                </div>
                <div style={styles.fieldGroup}>
                  <label style={t.label}>
                    Destination <span style={styles.requiredMark}>*</span>
                  </label>
                  <input
                    style={t.input}
                    type="text"
                    value={form.destination}
                    onChange={(e) => setField("destination", e.target.value)}
                  />
                </div>
              </div>

              <div style={styles.fieldGroup}>
                <label style={t.label}>Description</label>
                <textarea
                  style={t.textarea}
                  rows={3}
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                />
              </div>

              <div style={styles.formGrid}>
                <div style={styles.fieldGroup}>
                  <label style={t.label}>Shipper</label>
                  <select
                    style={t.select}
                    value={form.shipperId}
                    onChange={(e) => setField("shipperId", e.target.value)}
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
                    value={form.priority}
                    onChange={(e) => setField("priority", e.target.value)}
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
                    value={form.pickupAt}
                    onChange={(e) => setField("pickupAt", e.target.value)}
                  />
                </div>
                <div style={styles.fieldGroup}>
                  <label style={t.label}>Delivery due</label>
                  <input
                    style={t.input}
                    type="datetime-local"
                    value={form.deliveryDueAt}
                    onChange={(e) => setField("deliveryDueAt", e.target.value)}
                  />
                </div>
                <div style={styles.fieldGroup}>
                  <label style={t.label}>Weight (kg)</label>
                  <input
                    style={t.input}
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.weightKg}
                    onChange={(e) => setField("weightKg", e.target.value)}
                  />
                </div>
                <div style={styles.fieldGroup}>
                  <label style={t.label}>Declared value (₹)</label>
                  <input
                    style={t.input}
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.declaredValue}
                    onChange={(e) => setField("declaredValue", e.target.value)}
                  />
                </div>
              </div>

              {/* ── (b) Cargo items ── */}
              <div style={t.sectionTitle}>Cargo items</div>
              {items.length === 0 && (
                <div style={{ ...t.muted, marginBottom: "8px" }}>No cargo items yet.</div>
              )}
              {items.map((item, index) => (
                <div key={`item-${index}`} style={styles.stopRow}>
                  <input
                    style={{ ...t.input, flex: 2 }}
                    type="text"
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateItem(index, "description", e.target.value)}
                  />
                  <input
                    style={{ ...t.input, flex: 1, maxWidth: "90px" }}
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, "quantity", e.target.value)}
                  />
                  <input
                    style={{ ...t.input, flex: 1, maxWidth: "110px" }}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="kg"
                    value={item.weightKg}
                    onChange={(e) => updateItem(index, "weightKg", e.target.value)}
                  />
                  <button
                    style={{ ...styles.iconAction, borderColor: mt.inputBorder, color: "#EF4444" }}
                    onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
                    title="Remove item"
                  >
                    <TrashIcon size={13} color="#EF4444" />
                  </button>
                </div>
              ))}
              <button
                style={{ ...styles.btnSmall, borderColor: mt.inputBorder, color: mt.fieldLabel }}
                onClick={() =>
                  setItems((prev) => [...prev, { description: "", quantity: "1", weightKg: "" }])
                }
              >
                + Add item
              </button>

              {/* ── (c) Labels ── */}
              <div style={t.sectionTitle}>Labels</div>
              <div style={styles.fieldGroup}>
                <input
                  style={t.input}
                  type="text"
                  placeholder="Fragile, Cold chain, Express (comma separated)"
                  value={labelsText}
                  onChange={(e) => setLabelsText(e.target.value)}
                />
              </div>

              {/* ── (d) Assigned drivers ── */}
              <div style={t.sectionTitle}>Assigned drivers</div>
              <div style={styles.fieldGroup}>
                {drivers.length === 0 ? (
                  <div style={t.muted}>No drivers available in this workspace.</div>
                ) : (
                  <div style={t.checkGrid}>
                    {drivers.map((driver) => {
                      const name = [driver.firstName, driver.lastName]
                        .filter(Boolean)
                        .join(" ");
                      return (
                        <label key={driver.id} style={t.checkItem}>
                          <input
                            type="checkbox"
                            checked={driverIds.includes(driver.id)}
                            onChange={() =>
                              setDriverIds((prev) =>
                                prev.includes(driver.id)
                                  ? prev.filter((id) => id !== driver.id)
                                  : [...prev, driver.id]
                              )
                            }
                          />
                          {name}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ── (e) Comments ── */}
              <div style={t.sectionTitle}>
                Comments {detail?.comments ? `(${detail.comments.length})` : ""}
              </div>
              {detail?.comments?.length > 0 ? (
                <div style={{ marginBottom: "10px" }}>
                  {detail.comments.map((comment) => (
                    <div key={comment.id} style={t.commentItem}>
                      <div style={styles.commentHeader}>
                        <span style={{ fontWeight: 600, color: mt.text }}>
                          {comment.author?.fullName ||
                            comment.author?.email ||
                            comment.author?.username ||
                            "Unknown"}
                        </span>
                        <span style={{ fontSize: "11px", color: mt.sub }}>
                          {fmtDateTime(comment.createdAt)}
                        </span>
                      </div>
                      <div style={{ color: mt.fieldLabel, lineHeight: "1.5" }}>
                        {comment.body}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ ...t.muted, marginBottom: "8px" }}>No comments yet.</div>
              )}
              <div style={styles.stopRow}>
                <input
                  style={{ ...t.input, flex: 1 }}
                  type="text"
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddComment();
                  }}
                />
                <button
                  style={{ ...styles.btnSecondary, opacity: newComment.trim() ? 1 : 0.5 }}
                  onClick={handleAddComment}
                  disabled={commentBusy || !newComment.trim()}
                >
                  {commentBusy ? "Posting..." : "Comment"}
                </button>
              </div>

              {/* ── (f) Status history ── */}
              <div style={t.sectionTitle}>Status history</div>
              {detail?.statusHistory?.length > 0 ? (
                <div style={styles.timeline}>
                  {detail.statusHistory.map((entry) => (
                    <div key={entry.id} style={styles.timelineItem}>
                      <span
                        style={{
                          ...styles.dot,
                          background: entry.toColumn?.color || "#6B7280",
                        }}
                      />
                      <span style={{ color: mt.text, fontWeight: 600 }}>
                        {entry.toColumn?.name || "Moved"}
                      </span>
                      <span style={{ color: mt.sub, fontSize: "12px" }}>
                        {fmtDateTime(entry.movedAt)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={t.muted}>No status changes recorded yet.</div>
              )}
            </>
          )}
        </div>

        {/* ── (g) Footer ── */}
        <div style={t.modalFooter}>
          <button
            style={{
              ...styles.btnDanger,
              opacity: deleting ? 0.6 : 1,
              cursor: deleting ? "default" : "pointer",
            }}
            onClick={handleDelete}
            disabled={deleting || !form}
          >
            {deleting ? "Deleting..." : "Delete Shipment"}
          </button>
          <div style={styles.modalFooterRight}>
            <button
              style={{ ...styles.btnNeutral, borderColor: mt.inputBorder, color: mt.fieldLabel }}
              onClick={onClose}
              disabled={saving || deleting}
            >
              Cancel
            </button>
            <button
              style={{
                ...styles.btnPrimary,
                opacity: saving || !form ? 0.6 : 1,
                cursor: saving || !form ? "default" : "pointer",
              }}
              onClick={handleSave}
              disabled={saving || deleting || !form}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
