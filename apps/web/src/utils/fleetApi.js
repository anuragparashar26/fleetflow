import { apiRequest, unwrapData } from "./apiClient";

function workspaceHeaders(workspaceId) {
  if (!workspaceId) return undefined;
  return { "x-workspace-id": workspaceId };
}

function withWorkspace(path, workspaceId, query) {
  const params = new URLSearchParams();
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.set(key, String(value));
      }
    });
  }
  if (workspaceId && !params.has("workspace_id")) {
    params.set("workspace_id", workspaceId);
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

async function get(path, token, workspaceId, query) {
  const result = await apiRequest(withWorkspace(path, workspaceId, query), {
    token,
    headers: workspaceHeaders(workspaceId),
  });
  return unwrapData(result);
}

async function post(path, token, body, workspaceId) {
  const result = await apiRequest(path, {
    method: "POST",
    token,
    body,
    headers: workspaceHeaders(workspaceId),
  });
  return unwrapData(result);
}

async function put(path, token, body, workspaceId) {
  const result = await apiRequest(path, {
    method: "PUT",
    token,
    body,
    headers: workspaceHeaders(workspaceId),
  });
  return unwrapData(result);
}

async function del(path, token, workspaceId) {
  return apiRequest(path, {
    method: "DELETE",
    token,
    headers: workspaceHeaders(workspaceId),
  });
}

// --- Dashboard --------------------------------------------------------------

export async function getFleetDashboard(token, workspaceId) {
  return get("/fleet/dashboard", token, workspaceId);
}

// --- Boards -----------------------------------------------------------------

export async function listBoards(token, workspaceId) {
  return (await get("/fleet/boards", token, workspaceId)) || [];
}

export async function createBoard(token, payload, workspaceId) {
  return post("/fleet/boards", token, payload, workspaceId);
}

export async function updateBoard(token, boardId, payload, workspaceId) {
  return put(`/fleet/boards/${boardId}`, token, payload, workspaceId);
}

export async function deleteBoard(token, boardId, workspaceId) {
  return del(`/fleet/boards/${boardId}`, token, workspaceId);
}

// --- Shipments --------------------------------------------------------------

export async function listShipments(token, query, workspaceId) {
  return (await get("/fleet/shipments", token, workspaceId, query)) || [];
}

export async function createShipment(token, payload, workspaceId) {
  return post("/fleet/shipments", token, payload, workspaceId);
}

export async function getShipment(token, shipmentId, workspaceId) {
  return get(`/fleet/shipments/${shipmentId}`, token, workspaceId);
}

export async function updateShipment(token, shipmentId, payload, workspaceId) {
  return put(`/fleet/shipments/${shipmentId}`, token, payload, workspaceId);
}

export async function moveShipment(token, shipmentId, payload, workspaceId) {
  const result = await apiRequest(`/fleet/shipments/${shipmentId}/move`, {
    method: "PATCH",
    token,
    body: payload,
    headers: workspaceHeaders(workspaceId),
  });
  return unwrapData(result);
}

export async function deleteShipment(token, shipmentId, workspaceId) {
  return del(`/fleet/shipments/${shipmentId}`, token, workspaceId);
}

export async function addShipmentComment(token, shipmentId, body, workspaceId) {
  return post(`/fleet/shipments/${shipmentId}/comments`, token, { body }, workspaceId);
}

// --- Generic directory resources (shippers, vehicles, drivers, routes, trips)

export function listResource(resource) {
  return async (token, query, workspaceId) =>
    (await get(`/fleet/${resource}`, token, workspaceId, query)) || [];
}

export function getResource(resource) {
  return async (token, id, workspaceId) =>
    get(`/fleet/${resource}/${id}`, token, workspaceId);
}

export function createResource(resource) {
  return async (token, payload, workspaceId) =>
    post(`/fleet/${resource}`, token, payload, workspaceId);
}

export function updateResource(resource) {
  return async (token, id, payload, workspaceId) =>
    put(`/fleet/${resource}/${id}`, token, payload, workspaceId);
}

export function deleteResource(resource) {
  return async (token, id, workspaceId) => del(`/fleet/${resource}/${id}`, token, workspaceId);
}

// --- Vehicle extras ---------------------------------------------------------

export async function addFuelRecord(token, vehicleId, payload, workspaceId) {
  return post(`/fleet/vehicles/${vehicleId}/fuel`, token, payload, workspaceId);
}

export async function addServiceRecord(token, vehicleId, payload, workspaceId) {
  return post(`/fleet/vehicles/${vehicleId}/services`, token, payload, workspaceId);
}

// --- Activities -------------------------------------------------------------

export async function listActivities(token, query, workspaceId) {
  return (await get("/fleet/activities", token, workspaceId, query)) || [];
}

export async function createActivity(token, payload, workspaceId) {
  return post("/fleet/activities", token, payload, workspaceId);
}

export async function deleteActivity(token, activityId, workspaceId) {
  return del(`/fleet/activities/${activityId}`, token, workspaceId);
}

// --- Driver payouts ---------------------------------------------------------

export async function listPayouts(token, query, workspaceId) {
  return (await get("/fleet/payouts", token, workspaceId, query)) || [];
}

export async function createPayout(token, payload, workspaceId) {
  return post("/fleet/payouts", token, payload, workspaceId);
}

export async function updatePayout(token, payoutId, payload, workspaceId) {
  return put(`/fleet/payouts/${payoutId}`, token, payload, workspaceId);
}
