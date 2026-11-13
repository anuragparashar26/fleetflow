import supabase from "../../../utils/supabaseClient.js";
import { assertWorkspaceRole } from "../../../utils/workspaceContext.js";
import { logEvent as audit } from "../services/audit.service.js";

function slugify(input) {
  return String(input || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function buildError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function getAvailableSlug(baseSlug) {
  let slug = baseSlug;
  let suffix = 2;

  while (true) {
    const { data, error } = await supabase
      .from("workspaces")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (error) throw error;
    if (!data) return slug;

    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

export const listWorkspaces = async (req, res, next) => {
  try {
    const { data: memberships, error: membershipError } = await supabase
      .from("workspace_members")
      .select("workspace_id, role, joined_at")
      .eq("user_id", req.user.id);

    if (membershipError) throw membershipError;

    const workspaceIds = (memberships || []).map((membership) => membership.workspace_id);

    if (workspaceIds.length === 0) {
      return res.json({ data: [] });
    }

    const { data, error } = await supabase
      .from("workspaces")
      .select("*")
      .in("id", workspaceIds)
      .order("created_at", { ascending: true });

    if (error) throw error;
    const membershipByWorkspaceId = new Map(
      (memberships || []).map((membership) => [membership.workspace_id, membership])
    );

    const payload = (data || []).map((workspace) => ({
      ...workspace,
      member_role: membershipByWorkspaceId.get(workspace.id)?.role || null,
    }));

    res.json({ data: payload });
  } catch (err) {
    next(err);
  }
};

export const createWorkspace = async (req, res, next) => {
  try {
    const name = String(req.body?.name || "").trim();
    const providedSlug = String(req.body?.slug || "").trim();

    if (!name) {
      throw buildError(400, "name is required");
    }

    const requestedSlug = slugify(providedSlug || name);
    if (!requestedSlug) {
      throw buildError(400, "Valid workspace slug could not be generated");
    }
    const slug = await getAvailableSlug(requestedSlug);

    const { data, error } = await supabase
      .from("workspaces")
      .insert([{ name, slug }])
      .select("*")
      .single();

    if (error) {
      if (error.code === "23505" && error.message?.includes("workspaces_slug_key")) {
        throw buildError(409, "That workspace name is already being created. Please try again.");
      }
      throw error;
    }

    const { error: memberError } = await supabase
      .from("workspace_members")
      .insert([
        {
          workspace_id: data.id,
          user_id: req.user.id,
          role: "owner",
        },
      ]);

    if (memberError) throw memberError;

    await audit({
      workspace_id: data.id,
      actor_id: req.user.id,
      entity_type: "workspaces",
      entity_id: data.id,
      action: "create",
      old_values: null,
      new_values: data,
    });

    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
};

export const getWorkspace = async (req, res, next) => {
  try {
    await assertWorkspaceRole({
      userId: req.user.id,
      workspaceId: req.params.id,
      allowedRoles: ["owner", "admin", "manager", "member"],
    });

    const { data, error } = await supabase
      .from("workspaces")
      .select("*")
      .eq("id", req.params.id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Not Found" });

    res.json({ data });
  } catch (err) {
    next(err);
  }
};

export const updateWorkspace = async (req, res, next) => {
  try {
    await assertWorkspaceRole({
      userId: req.user.id,
      workspaceId: req.params.id,
      allowedRoles: ["owner", "admin"],
    });

    const name = typeof req.body?.name === "string" ? req.body.name.trim() : undefined;
    const slugInput = typeof req.body?.slug === "string" ? req.body.slug.trim() : undefined;
    const updates = {};

    if (name) updates.name = name;
    if (slugInput || name) {
      const parsedSlug = slugify(slugInput || name);
      if (!parsedSlug) throw buildError(400, "Invalid slug");
      updates.slug = parsedSlug;
    }

    if (Object.keys(updates).length === 0) {
      throw buildError(400, "No valid fields to update");
    }

    const { data: old, error: oldError } = await supabase
      .from("workspaces")
      .select("*")
      .eq("id", req.params.id)
      .single();
    if (oldError) throw oldError;

    const { data, error } = await supabase
      .from("workspaces")
      .update(updates)
      .eq("id", req.params.id)
      .select("*")
      .single();

    if (error) throw error;

    await audit({
      workspace_id: data.id,
      actor_id: req.user.id,
      entity_type: "workspaces",
      entity_id: data.id,
      action: "update",
      old_values: old,
      new_values: data,
    });

    res.json({ data });
  } catch (err) {
    next(err);
  }
};

export const deleteWorkspace = async (req, res, next) => {
  try {
    await assertWorkspaceRole({
      userId: req.user.id,
      workspaceId: req.params.id,
      allowedRoles: ["owner", "admin"],
    });

    const { data: old, error: oldError } = await supabase
      .from("workspaces")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (oldError) throw oldError;

    const { error } = await supabase
      .from("workspaces")
      .delete()
      .eq("id", req.params.id);

    if (error) throw error;

    await audit({
      workspace_id: old.id,
      actor_id: req.user.id,
      entity_type: "workspaces",
      entity_id: old.id,
      action: "delete",
      old_values: old,
      new_values: null,
    });

    res.status(204).end();
  } catch (err) {
    next(err);
  }
};
