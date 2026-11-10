import supabase from "./supabaseClient.js";

function buildError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

export async function resolveWorkspaceContext(req, { required = true } = {}) {
  const userId = req.user?.id || req.auth?.userId;
  if (!userId) {
    throw buildError(401, "Unauthorized");
  }

  const requestedWorkspaceId =
    (typeof req.headers["x-workspace-id"] === "string" && req.headers["x-workspace-id"].trim()) ||
    req.query?.workspace_id ||
    req.body?.workspace_id ||
    null;

  if (requestedWorkspaceId) {
    const { data, error } = await supabase
      .from("workspace_members")
      .select("workspace_id, role")
      .eq("user_id", userId)
      .eq("workspace_id", requestedWorkspaceId)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      if (!required) return null;
      throw buildError(403, "Access denied for selected workspace");
    }

    return {
      workspaceId: data.workspace_id,
      role: data.role,
    };
  }

  const { data, error } = await supabase
    .from("workspace_members")
    .select("workspace_id, role")
    .eq("user_id", userId)
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    if (!required) return null;
    throw buildError(404, "No workspace membership found");
  }

  return {
    workspaceId: data.workspace_id,
    role: data.role,
  };
}

export async function assertWorkspaceRole({ userId, workspaceId, allowedRoles }) {
  if (!userId) {
    throw buildError(401, "Unauthorized");
  }
  if (!workspaceId) {
    throw buildError(400, "workspace_id is required");
  }

  const { data, error } = await supabase
    .from("workspace_members")
    .select("workspace_id, role, user_id")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data || !allowedRoles.includes(data.role)) {
    throw buildError(403, "Access denied: insufficient workspace permissions");
  }

  return data;
}
