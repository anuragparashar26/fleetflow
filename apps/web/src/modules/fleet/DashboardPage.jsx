import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "../../components/sidebar";
import KanbanBoard from "./KanbanBoard";
import NewShipmentModal from "./NewShipmentModal";
import EditShipmentModal from "./EditShipmentModal";
import { MoonIcon, SearchIcon, SunIcon, XIcon } from "../../components/icons";
import {
  DARK,
  LIGHT,
  clearWorkspaceId,
  isWorkspaceAccessError,
  readWorkspaceId,
  slugify,
  styles,
  writeWorkspaceId,
} from "./shared";
import {
  addShipmentComment,
  createBoard,
  createShipment,
  deleteShipment,
  getFleetDashboard,
  getShipment,
  listBoards,
  listResource,
  listShipments,
  moveShipment,
  updateShipment,
} from "../../utils/fleetApi";
import {
  addMember,
  createWorkspace,
  listMembers,
  listWorkspaces,
  removeMemberById,
  updateMemberById,
} from "../../utils/platformApi";

const listDrivers = listResource("drivers");
const listShippers = listResource("shippers");

export default function DashboardPage({
  user,
  onLogout,
  darkMode,
  onToggleDarkMode,
  onOpenProfile,
  getToken,
}) {
  const theme = darkMode ? DARK : LIGHT;

  const [workspaces, setWorkspaces] = useState([]);
  const [workspacesLoading, setWorkspacesLoading] = useState(true);
  const [workspaceId, setWorkspaceId] = useState(() => readWorkspaceId());
  const [workspaceError, setWorkspaceError] = useState("");
  const [workspaceMessage, setWorkspaceMessage] = useState("");

  const [dashboard, setDashboard] = useState(null);
  const [boards, setBoards] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [shippers, setShippers] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [showNewShipment, setShowNewShipment] = useState(false);
  const [editingShipmentId, setEditingShipmentId] = useState(null);
  const [showMembers, setShowMembers] = useState(false);

  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [creatingWorkspace, setCreatingWorkspace] = useState(false);

  const hasLoadedRef = useRef(false);

  const getAuthToken = useCallback(async () => {
    if (!getToken) throw new Error("Auth provider unavailable");
    const token = await getToken();
    if (!token) throw new Error("Missing auth token");
    return token;
  }, [getToken]);

  // ── Fleet data (mount + 15s polling, guarded by the "active" flag) ────────
  const fetchAll = useCallback(
    async (isActive = () => true) => {
      try {
        const token = await getAuthToken();
        const ws = workspaceId || undefined;
        const [dash, boardsList, shipmentsList, shippersList, driversList] =
          await Promise.all([
            getFleetDashboard(token, ws),
            listBoards(token, ws),
            listShipments(token, {}, ws),
            listShippers(token, {}, ws),
            listDrivers(token, {}, ws),
          ]);

        if (!isActive()) return;

        setDashboard(dash || null);
        setBoards(Array.isArray(boardsList) ? boardsList : []);
        setShipments(Array.isArray(shipmentsList) ? shipmentsList : []);
        setShippers(Array.isArray(shippersList) ? shippersList : []);
        setDrivers(Array.isArray(driversList) ? driversList : []);
        setLoadError("");
        hasLoadedRef.current = true;
      } catch (err) {
        if (!isActive()) return;

        if (isWorkspaceAccessError(err)) {
          clearWorkspaceId();
          setWorkspaceId(null);
          setWorkspaceMessage(
            "Access denied for the selected workspace — switched to the default workspace."
          );
          return;
        }
        setLoadError(err.message || "Failed to load fleet data");
      } finally {
        if (isActive()) setLoading(false);
      }
    },
    [getAuthToken, workspaceId]
  );

  useEffect(() => {
    let active = true;
    const isActive = () => active;

    if (!hasLoadedRef.current) setLoading(true);
    fetchAll(isActive);

    const intervalId = window.setInterval(() => {
      if (document.hidden) return;
      fetchAll(isActive);
    }, 15000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [fetchAll]);

  // ── Workspaces ─────────────────────────────────────────────────────────────
  const loadWorkspaces = useCallback(async () => {
    setWorkspacesLoading(true);
    setWorkspaceError("");
    try {
      const token = await getAuthToken();
      const data = await listWorkspaces(token);
      const list = Array.isArray(data) ? data : [];
      setWorkspaces(list);

      const stored = readWorkspaceId();
      if (stored && list.length > 0 && !list.some((item) => item.id === stored)) {
        clearWorkspaceId();
        setWorkspaceId(null);
        setWorkspaceMessage("Saved workspace is no longer available — using the default workspace.");
      }
    } catch (err) {
      setWorkspaceError(err.message || "Failed to load workspaces");
    } finally {
      setWorkspacesLoading(false);
    }
  }, [getAuthToken]);

  useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

  const handleWorkspaceChange = (event) => {
    const nextId = event.target.value || null;
    writeWorkspaceId(nextId);
    setWorkspaceId(nextId);
    setWorkspaceMessage("");
    setWorkspaceError("");
    setLoadError("");
  };

  const handleCreateWorkspace = async () => {
    const name = newWorkspaceName.trim();
    if (!name) {
      setWorkspaceError("Enter a workspace name.");
      return;
    }
    setCreatingWorkspace(true);
    setWorkspaceError("");
    try {
      const token = await getAuthToken();
      const slug = slugify(name) || `workspace-${Date.now()}`;
      const created = await createWorkspace(token, { name, slug });
      if (created?.id) writeWorkspaceId(created.id);
      setWorkspaceId(created?.id || null);
      setNewWorkspaceName("");
      setWorkspaceMessage(`Workspace "${created?.name || name}" created.`);
      await loadWorkspaces();
    } catch (err) {
      setWorkspaceError(err.message || "Unable to create workspace");
    } finally {
      setCreatingWorkspace(false);
    }
  };

  // ── Derived board data ─────────────────────────────────────────────────────
  const board = boards.length > 0 ? boards[0] : null;

  const columns = useMemo(() => {
    if (!board) return [];
    return [...(board.columns || [])]
      .sort((a, b) => a.position - b.position)
      .map((column) => ({
        id: column.id,
        name: column.name,
        color: column.color,
      }));
  }, [board]);

  const visibleShipments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return shipments;
    return shipments.filter((shipment) =>
      [shipment.title, shipment.trackingNo, shipment.origin, shipment.destination]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [shipments, searchQuery]);

  const kpis = useMemo(() => {
    const idleVehicles =
      dashboard?.vehicles?.byStatus?.find((row) => row.status === "idle")?.count || 0;
    return [
      { label: "Total Shipments", value: dashboard?.shipments?.total ?? "—", accent: "#4F46E5" },
      { label: "Due Soon", value: dashboard?.shipments?.dueSoon ?? "—", accent: "#F59E0B" },
      { label: "Active Trips", value: dashboard?.trips?.active ?? "—", accent: "#06B6D4" },
      { label: "Vehicles Idle", value: idleVehicles, accent: "#8B5CF6" },
      { label: "Pending Payouts", value: dashboard?.payouts?.pending ?? "—", accent: "#10B981" },
      { label: "Open Activities", value: dashboard?.activities?.open ?? "—", accent: "#EC4899" },
    ];
  }, [dashboard]);

  // ── Shipment actions ───────────────────────────────────────────────────────
  const handleMoveShipment = async (shipmentId, columnId) => {
    const previous = shipments;
    setLoadError("");
    setShipments((prev) =>
      prev.map((shipment) =>
        shipment.id === shipmentId ? { ...shipment, columnId } : shipment
      )
    );

    try {
      const token = await getAuthToken();
      const ws = workspaceId || undefined;
      await moveShipment(token, shipmentId, { columnId }, ws);
      const [dash, boardsList, shipmentsList] = await Promise.all([
        getFleetDashboard(token, ws),
        listBoards(token, ws),
        listShipments(token, {}, ws),
      ]);
      setDashboard(dash || null);
      setBoards(Array.isArray(boardsList) ? boardsList : []);
      setShipments(Array.isArray(shipmentsList) ? shipmentsList : []);
    } catch (err) {
      setShipments(previous);
      if (isWorkspaceAccessError(err)) {
        clearWorkspaceId();
        setWorkspaceId(null);
        setWorkspaceMessage(
          "Access denied for the selected workspace — switched to the default workspace."
        );
        return;
      }
      setLoadError(err.message || "Unable to move shipment");
    }
  };

  const handleCreateShipment = useCallback(
    async (payload) => {
      const token = await getAuthToken();
      await createShipment(token, payload, workspaceId || undefined);
      await fetchAll();
    },
    [fetchAll, getAuthToken, workspaceId]
  );

  const handleFetchShipment = useCallback(async () => {
    const token = await getAuthToken();
    return getShipment(token, editingShipmentId, workspaceId || undefined);
  }, [editingShipmentId, getAuthToken, workspaceId]);

  const handleSaveShipment = useCallback(
    async (payload) => {
      const token = await getAuthToken();
      await updateShipment(token, editingShipmentId, payload, workspaceId || undefined);
      await fetchAll();
    },
    [editingShipmentId, fetchAll, getAuthToken, workspaceId]
  );

  const handleDeleteShipment = useCallback(async () => {
    const token = await getAuthToken();
    await deleteShipment(token, editingShipmentId, workspaceId || undefined);
    await fetchAll();
  }, [editingShipmentId, fetchAll, getAuthToken, workspaceId]);

  const handleAddComment = useCallback(
    async (body) => {
      const token = await getAuthToken();
      await addShipmentComment(token, editingShipmentId, body, workspaceId || undefined);
    },
    [editingShipmentId, getAuthToken, workspaceId]
  );

  const handleCreateBoard = async () => {
    setLoadError("");
    try {
      const token = await getAuthToken();
      await createBoard(token, { name: "Fleet Board" }, workspaceId || undefined);
      await fetchAll();
    } catch (err) {
      if (isWorkspaceAccessError(err)) {
        clearWorkspaceId();
        setWorkspaceId(null);
        setWorkspaceMessage(
          "Access denied for the selected workspace — switched to the default workspace."
        );
        return;
      }
      setLoadError(err.message || "Unable to create board");
    }
  };

  const dismissMessage = (setter) => setter("");

  const workspacesEmpty =
    !workspacesLoading && workspaces.length === 0 && !workspaceError;

  return (
    <div style={{ ...styles.page, background: theme.pageBg }}>
      <Sidebar
        darkMode={darkMode}
        user={user}
        onLogout={onLogout}
        onOpenProfile={onOpenProfile}
      />

      <div style={styles.mainArea}>
        {/* ── Top navbar ── */}
        <header
          style={{
            ...styles.topNav,
            background: theme.navBg,
            borderBottomColor: theme.border,
          }}
        >
          <div style={styles.navLeft}>
            <span style={{ ...styles.pageTitle, color: theme.text }}>
              Fleet Dashboard
            </span>
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
                placeholder="Search shipments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  style={styles.clearBtn}
                  onClick={() => setSearchQuery("")}
                  title="Clear search"
                >
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
              value={workspaceId || ""}
              onChange={handleWorkspaceChange}
              title="Switch workspace"
            >
              <option value="">Default workspace</option>
              {workspaces.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </option>
              ))}
            </select>

            <button
              style={{
                ...styles.btnNeutral,
                background: theme.toggleBg,
                borderColor: theme.border,
                color: theme.text,
              }}
              onClick={() => setShowMembers(true)}
            >
              Members
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

        {/* ── Banners ── */}
        {(workspaceError || loadError) && (
          <div style={styles.errorBanner}>
            <span>{workspaceError || loadError}</span>
            <button
              style={styles.bannerDismiss}
              onClick={() => {
                setWorkspaceError("");
                setLoadError("");
              }}
            >
              <XIcon size={12} color="#B91C1C" />
            </button>
          </div>
        )}
        {workspaceMessage && (
          <div style={styles.successBanner}>
            <span>{workspaceMessage}</span>
            <button
              style={styles.bannerDismiss}
              onClick={() => dismissMessage(setWorkspaceMessage)}
            >
              <XIcon size={12} color="#166534" />
            </button>
          </div>
        )}

        {/* ── Content ── */}
        <div style={{ ...styles.content, background: theme.pageBg }}>
          {workspacesEmpty ? (
            <div style={styles.scrollContent}>
              <div
                style={{
                  ...styles.panel,
                  background: theme.cardBg,
                  borderColor: theme.border,
                  maxWidth: "480px",
                  marginTop: "24px",
                }}
              >
                <div style={{ ...styles.panelTitle, color: theme.text }}>
                  Create a workspace
                </div>
                <div style={{ ...styles.mutedText, color: theme.muted, marginBottom: "12px" }}>
                  Workspaces group your fleet data (shipments, vehicles, drivers and
                  members). Create one to start operating.
                </div>
                <input
                  style={{
                    ...styles.input,
                    background: theme.inputBg,
                    borderColor: theme.inputBorder,
                    color: theme.inputText,
                    marginBottom: "10px",
                  }}
                  type="text"
                  placeholder="Workspace name"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateWorkspace()}
                />
                <button
                  style={{ ...styles.btnPrimary, opacity: creatingWorkspace ? 0.6 : 1 }}
                  onClick={handleCreateWorkspace}
                  disabled={creatingWorkspace}
                >
                  {creatingWorkspace ? "Creating..." : "Create Workspace"}
                </button>
              </div>
            </div>
          ) : loading && !hasLoadedRef.current ? (
            <div style={{ ...styles.loadingRow, color: theme.muted }}>
              Loading fleet data...
            </div>
          ) : (
            <>
              {/* ── KPI row ── */}
              <div style={{ padding: "18px 24px 0" }}>
                <div style={styles.kpiRow}>
                  {kpis.map((kpi) => (
                    <div
                      key={kpi.label}
                      style={{
                        ...styles.kpiCard,
                        background: theme.cardBg,
                        borderColor: theme.border,
                      }}
                    >
                      <span
                        style={{ ...styles.kpiAccent, background: kpi.accent }}
                      />
                      <div style={{ ...styles.kpiLabel, color: theme.muted }}>
                        {kpi.label}
                      </div>
                      <div style={{ ...styles.kpiValue, color: theme.text }}>
                        {kpi.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* ── Board toolbar ── */}
                <div style={styles.toolbar}>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: "700", color: theme.text }}>
                      {board ? board.name : "Shipment Board"}
                    </div>
                    <div style={{ ...styles.toolbarMeta, color: theme.muted }}>
                      {visibleShipments.length === 0
                        ? "No shipments yet — create one"
                        : `${visibleShipments.length} shipment(s) · ${columns.length} stage(s)`}
                    </div>
                  </div>
                  <div style={styles.toolbarActions}>
                    <button
                      style={{
                        ...styles.btnNeutral,
                        borderColor: theme.border,
                        color: theme.text,
                      }}
                      onClick={() => fetchAll()}
                      disabled={loading}
                    >
                      {loading ? "Syncing..." : "Refresh"}
                    </button>
                    <button style={styles.btnPrimary} onClick={() => setShowNewShipment(true)}>
                      + New Shipment
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Kanban board ── */}
              {board ? (
                <KanbanBoard
                  columns={columns}
                  shipments={visibleShipments}
                  onMove={handleMoveShipment}
                  onOpenShipment={(shipment) => setEditingShipmentId(shipment.id)}
                  darkMode={darkMode}
                />
              ) : (
                <div style={styles.scrollContent}>
                  <div
                    style={{
                      ...styles.panel,
                      background: theme.cardBg,
                      borderColor: theme.border,
                      textAlign: "center",
                      padding: "40px 20px",
                    }}
                  >
                    <div style={{ ...styles.panelTitle, color: theme.text }}>
                      No board yet
                    </div>
                    <div
                      style={{
                        ...styles.mutedText,
                        color: theme.muted,
                        marginBottom: "14px",
                      }}
                    >
                      Create a board to arrange shipments across booking, transit and
                      delivery stages.
                    </div>
                    <button style={styles.btnPrimary} onClick={handleCreateBoard}>
                      Create Board
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      {showNewShipment && (
        <NewShipmentModal
          shippers={shippers}
          drivers={drivers}
          darkMode={darkMode}
          onClose={() => setShowNewShipment(false)}
          onCreate={handleCreateShipment}
        />
      )}

      {editingShipmentId && (
        <EditShipmentModal
          shippers={shippers}
          drivers={drivers}
          darkMode={darkMode}
          onClose={() => setEditingShipmentId(null)}
          onFetch={handleFetchShipment}
          onSave={handleSaveShipment}
          onDelete={handleDeleteShipment}
          onAddComment={handleAddComment}
        />
      )}

      {showMembers && (
        <MembersModal
          workspaceId={workspaceId}
          getToken={getToken}
          darkMode={darkMode}
          onClose={() => setShowMembers(false)}
        />
      )}
    </div>
  );
}

// ── Compact workspace member management (RBAC) ───────────────────────────────
function MembersModal({ workspaceId, getToken, darkMode = false, onClose }) {
  const theme = darkMode ? DARK : LIGHT;
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [identity, setIdentity] = useState("");
  const [role, setRole] = useState("member");
  const [editRoles, setEditRoles] = useState({});
  const [busy, setBusy] = useState(false);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = await getToken();
      const data = await listMembers(token, workspaceId || undefined);
      setMembers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load members");
    } finally {
      setLoading(false);
    }
  }, [getToken, workspaceId]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const handleAdd = async () => {
    const value = identity.trim();
    if (!value) {
      setError("Enter an email or Clerk user ID.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const token = await getToken();
      const payload = { role };
      if (value.includes("@")) payload.email = value.toLowerCase();
      else payload.user_id = value;

      const result = await addMember(token, payload, workspaceId || undefined);
      setIdentity("");
      if (result?.invited) {
        setMessage(result.message || `Invitation sent to ${result.email}.`);
      } else {
        setMessage("Member added successfully.");
        await loadMembers();
      }
    } catch (err) {
      setError(err.message || "Unable to add member");
    } finally {
      setBusy(false);
    }
  };

  const handleUpdateRole = async (memberId) => {
    const nextRole = editRoles[memberId] || "member";
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const token = await getToken();
      await updateMemberById(token, memberId, { role: nextRole });
      setMessage("Member role updated.");
      await loadMembers();
    } catch (err) {
      setError(err.message || "Unable to update member role");
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (memberId) => {
    if (!window.confirm("Remove this member from the workspace?")) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const token = await getToken();
      await removeMemberById(token, memberId);
      setMessage("Member removed.");
      await loadMembers();
    } catch (err) {
      setError(err.message || "Unable to remove member");
    } finally {
      setBusy(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const roleOptions = ["owner", "admin", "manager", "member"];

  return (
    <div style={styles.backdrop} onClick={handleBackdropClick}>
      <div style={{ ...styles.modal, background: theme.cardBg }}>
        <div
          style={{
            ...styles.modalHeader,
            borderBottomColor: theme.border,
          }}
        >
          <div>
            <div style={{ ...styles.modalTitle, color: theme.text }}>Workspace Members</div>
            <div style={{ ...styles.modalSub, color: theme.muted }}>
              Manage who can access this workspace and what role they hold
            </div>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>
            <XIcon size={14} color={theme.muted} />
          </button>
        </div>

        <div style={styles.modalBody}>
          {error && <div style={styles.modalBanner}>{error}</div>}
          {message && <div style={styles.modalSuccess}>{message}</div>}

          <div style={{ display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap" }}>
            <input
              style={{
                ...styles.input,
                flex: 1,
                minWidth: "200px",
                background: theme.inputBg,
                borderColor: theme.inputBorder,
                color: theme.inputText,
              }}
              type="text"
              placeholder="Email or Clerk user ID"
              value={identity}
              onChange={(e) => setIdentity(e.target.value)}
            />
            <select
              style={{
                ...styles.select,
                width: "auto",
                background: theme.inputBg,
                borderColor: theme.inputBorder,
                color: theme.inputText,
              }}
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              {roleOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <button style={styles.btnPrimary} onClick={handleAdd} disabled={busy}>
              Add Member
            </button>
          </div>

          {loading ? (
            <div style={{ ...styles.mutedText, color: theme.muted }}>Loading members...</div>
          ) : members.length === 0 ? (
            <div style={{ ...styles.mutedText, color: theme.muted }}>
              No members yet — add one above.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {members.map((member) => {
                const currentRole = editRoles[member.id] || member.role || "member";
                const name =
                  member.display_name ||
                  member.user_full_name ||
                  member.user_id ||
                  "unknown";
                return (
                  <div
                    key={member.id}
                    style={{
                      ...styles.listRow,
                      background: theme.pageBg,
                      borderColor: theme.border,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: "180px", color: theme.text }}>
                      <strong>{name}</strong>
                      <span style={{ color: theme.muted, marginLeft: "6px" }}>
                        ({member.role || "member"})
                      </span>
                      {member.user_email && (
                        <div style={{ fontSize: "11px", color: theme.muted }}>
                          {member.user_email}
                        </div>
                      )}
                    </div>
                    <select
                      style={{
                        ...styles.select,
                        width: "auto",
                        background: theme.inputBg,
                        borderColor: theme.inputBorder,
                        color: theme.inputText,
                      }}
                      value={currentRole}
                      onChange={(e) =>
                        setEditRoles((prev) => ({ ...prev, [member.id]: e.target.value }))
                      }
                    >
                      {roleOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <button
                      style={{
                        ...styles.btnSmall,
                        borderColor: theme.border,
                        color: theme.text,
                      }}
                      onClick={() => handleUpdateRole(member.id)}
                      disabled={busy}
                    >
                      Update
                    </button>
                    <button
                      style={{
                        ...styles.btnSmall,
                        borderColor: "#FCA5A5",
                        color: "#EF4444",
                      }}
                      onClick={() => handleRemove(member.id)}
                      disabled={busy}
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div
            style={{
              fontSize: "11px",
              color: theme.muted,
              marginTop: "12px",
              lineHeight: "1.5",
            }}
          >
            Roles: owner/admin/manager can delete records &amp; manage payouts ·
            member can operate day to day.
          </div>
        </div>

        <div style={{ ...styles.modalFooter, borderTopColor: theme.border }}>
          <div style={styles.modalFooterRight}>
            <button
              style={{
                ...styles.btnNeutral,
                borderColor: theme.border,
                color: theme.text,
              }}
              onClick={onClose}
            >
              Close
            </button>
            <button
              style={styles.btnSecondary}
              onClick={loadMembers}
              disabled={loading || busy}
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
