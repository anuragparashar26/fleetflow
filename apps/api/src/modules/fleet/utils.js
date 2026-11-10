import prisma from "../../utils/prisma.js";

// Role matrix (matches platform roles: owner, admin, manager, member, viewer)
// - viewer: read-only
// - member: operational writes (shipments, moves, activities, fuel, services)
// - manager/admin/owner: everything, including deletes & payouts
export const OPERATOR_ROLES = ["owner", "admin", "manager", "member"];
export const MANAGER_ROLES = ["owner", "admin", "manager"];

export function buildError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

export function toApiError(err) {
  if (err.status) return err;
  switch (err.code) {
    case "P2002":
      return buildError(409, "A record with these details already exists");
    case "P2003":
      return buildError(409, "Operation conflicts with related records");
    case "P2014":
      return buildError(409, "Operation conflicts with related records");
    case "P2025":
      return buildError(404, "Resource not found");
    default:
      return err;
  }
}

/**
 * Resolves the caller's workspace membership for fleet routes.
 * Mirrors resolveWorkspaceContext() semantics but goes through Prisma and
 * also exposes the caller's role for RBAC checks.
 */
export async function fleetContext(req, _res, next) {
  try {
    const userId = req.user?.id || req.auth?.userId;
    if (!userId) throw buildError(401, "Unauthorized");

    const requestedWorkspaceId =
      (typeof req.headers["x-workspace-id"] === "string" && req.headers["x-workspace-id"].trim()) ||
      req.query?.workspace_id ||
      req.body?.workspace_id ||
      null;

    let membership = null;
    if (requestedWorkspaceId) {
      membership = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId: requestedWorkspaceId, userId } },
      });
      if (!membership) throw buildError(403, "Access denied for selected workspace");
    } else {
      membership = await prisma.workspaceMember.findFirst({
        where: { userId },
        orderBy: { joinedAt: "asc" },
      });
      if (!membership) throw buildError(404, "No workspace membership found");
    }

    req.fleet = {
      userId,
      workspaceId: membership.workspaceId,
      role: membership.role,
    };
    next();
  } catch (err) {
    next(toApiError(err));
  }
}

export function requireRoles(...roles) {
  return (req, _res, next) => {
    if (!req.fleet) return next(buildError(401, "Unauthorized"));
    if (!roles.includes(req.fleet.role)) {
      return next(buildError(403, "Access denied: insufficient workspace permissions"));
    }
    next();
  };
}

/** Fetch a workspace-owned record or throw 404 (prevents cross-tenant access). */
export async function ensureOwned(model, id, workspaceId, label) {
  const record = await prisma[model].findUnique({ where: { id } });
  if (!record || record.workspaceId !== workspaceId) {
    throw buildError(404, `${label} not found`);
  }
  return record;
}

export function workspaceOf(req) {
  return req.fleet.workspaceId;
}
