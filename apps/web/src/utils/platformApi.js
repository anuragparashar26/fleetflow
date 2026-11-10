import { apiRequest, unwrapData } from "./apiClient";

export async function syncUserProfile(token, payload) {
  return apiRequest("/auth/sync", {
    method: "POST",
    token,
    body: payload,
  });
}

export async function getMyProfile(token) {
  return apiRequest("/auth/me", { token });
}

export async function listWorkspaces(token) {
  const payload = await apiRequest("/workspaces", { token });
  return unwrapData(payload) || [];
}

export async function createWorkspace(token, payload) {
  const result = await apiRequest("/workspaces", {
    method: "POST",
    token,
    body: payload,
  });
  return unwrapData(result);
}

export async function getWorkspaceById(token, workspaceId) {
  const result = await apiRequest(`/workspaces/${workspaceId}`, { token });
  return unwrapData(result);
}

export async function updateWorkspaceById(token, workspaceId, payload) {
  const result = await apiRequest(`/workspaces/${workspaceId}`, {
    method: "PUT",
    token,
    body: payload,
  });
  return unwrapData(result);
}

export async function deleteWorkspaceById(token, workspaceId) {
  return apiRequest(`/workspaces/${workspaceId}`, {
    method: "DELETE",
    token,
  });
}

export async function listMembers(token, workspaceId) {
  const path = workspaceId
    ? `/members?workspace_id=${encodeURIComponent(workspaceId)}`
    : "/members";
  const result = await apiRequest(path, { token });
  return unwrapData(result) || [];
}

export async function addMember(token, payload, workspaceId) {
  const body = workspaceId ? { ...payload, workspace_id: workspaceId } : payload;
  const result = await apiRequest("/members", {
    method: "POST",
    token,
    body,
  });
  return unwrapData(result);
}

export async function updateMemberById(token, memberId, payload) {
  const result = await apiRequest(`/members/${memberId}`, {
    method: "PUT",
    token,
    body: payload,
  });
  return unwrapData(result);
}

export async function removeMemberById(token, memberId) {
  return apiRequest(`/members/${memberId}`, {
    method: "DELETE",
    token,
  });
}
