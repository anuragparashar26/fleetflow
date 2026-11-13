import supabase from "../../../utils/supabaseClient.js";
import { assertWorkspaceRole, resolveWorkspaceContext } from "../../../utils/workspaceContext.js";
import { logEvent as audit } from "../services/audit.service.js";
import { createNotification as notify } from "../services/notification.service.js";

const VALID_ROLES = ["owner", "admin", "manager", "member"];

function buildError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function buildMemberView(member, profile) {
  const displayName =
    profile?.full_name ||
    profile?.username ||
    profile?.email ||
    member.user_id;

  return {
    ...member,
    display_name: displayName,
    user_email: profile?.email || null,
    user_full_name: profile?.full_name || null,
    user_username: profile?.username || null,
  };
}

async function getProfileMapForMembers(memberRows) {
  const userIds = Array.from(
    new Set((memberRows || []).map((row) => row.user_id).filter(Boolean))
  );

  if (userIds.length === 0) {
    return new Map();
  }

  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("clerk_user_id, email, full_name, username")
    .in("clerk_user_id", userIds);

  if (profileError) throw profileError;

  return new Map((profiles || []).map((profile) => [profile.clerk_user_id, profile]));
}

export const listMembers = async (req, res, next) => {
  try {
    const context = await resolveWorkspaceContext(req, { required: true });

    const { data: members, error } = await supabase
      .from("workspace_members")
      .select("*")
      .eq("workspace_id", context.workspaceId)
      .order("joined_at", { ascending: true });

    if (error) throw error;

    const profileMap = await getProfileMapForMembers(members || []);
    const data = (members || []).map((member) =>
      buildMemberView(member, profileMap.get(member.user_id))
    );

    res.json({ data });
  } catch (err) {
    next(err);
  }
};

export const addMember = async (req, res, next) => {
  try {
    const context = await resolveWorkspaceContext(req, { required: true });

    await assertWorkspaceRole({
      userId: req.user.id,
      workspaceId: context.workspaceId,
      allowedRoles: ["owner", "admin"],
    });

    const userIdInput = String(req.body?.user_id || "").trim();
    const emailInput = String(req.body?.email || "").trim().toLowerCase();
    const role = String(req.body?.role || "member").trim().toLowerCase();

    if (!userIdInput && !emailInput) {
      throw buildError(400, "user_id or email is required");
    }
    if (!VALID_ROLES.includes(role)) {
      throw buildError(400, `Invalid role. Allowed roles: ${VALID_ROLES.join(", ")}`);
    }

    let userId = userIdInput;
    let resolvedEmail = emailInput || null;

    if (!userId && emailInput) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("clerk_user_id, email")
        .eq("email", emailInput)
        .maybeSingle();

      if (profileError) throw profileError;

      if (profile?.clerk_user_id) {
        userId = profile.clerk_user_id;
        resolvedEmail = profile.email || emailInput;
      } else {
        const redirectUrl = `${process.env.FRONTEND_ORIGIN || "http://localhost:5173"}/register`;

        const { error: invitationError } = await supabase.auth.admin.inviteUserByEmail(emailInput, {
          redirectTo: redirectUrl,
          data: {
            invited_workspace_id: context.workspaceId,
            invited_workspace_role: role,
            invited_by: req.user.id,
          },
        });
        if (invitationError) throw invitationError;

        res.status(202).json({
          data: {
            invited: true,
            email: emailInput,
            role,
            workspace_id: context.workspaceId,
            message: "Invitation email sent. After sign-up, this user will be added to the workspace automatically.",
          },
        });
        return;
      }
    }

    const { data, error } = await supabase
      .from("workspace_members")
      .insert([{ workspace_id: context.workspaceId, user_id: userId, role }])
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        throw buildError(409, "This user is already a member of this workspace");
      }
      throw error;
    }

    // Audit log
    await audit({
      workspace_id: context.workspaceId,
      actor_id: req.user.id,
      entity_type: "workspace_members",
      entity_id: data.id,
      action: "create",
      old_values: null,
      new_values: data,
    });

    // Notification
    await notify({
      workspace_id: context.workspaceId,
      recipient_id: userId,
      type: "assigned",
      title: "Added to workspace",
      message: `You have been added as ${role}`,
      entity_type: "workspace_members",
      entity_id: data.id,
    });

    const { data: memberProfile, error: memberProfileError } = await supabase
      .from("profiles")
      .select("clerk_user_id, email, full_name, username")
      .eq("clerk_user_id", userId)
      .maybeSingle();

    if (memberProfileError) throw memberProfileError;

    const memberView = buildMemberView(data, memberProfile || null);

    res.status(201).json({
      data: {
        ...memberView,
        invited: false,
        email: resolvedEmail || memberView.user_email || null,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const updateMember = async (req, res, next) => {
  try {
    const role = String(req.body?.role || "").trim().toLowerCase();
    if (!VALID_ROLES.includes(role)) {
      throw buildError(400, `Invalid role. Allowed roles: ${VALID_ROLES.join(", ")}`);
    }

    const { data: old, error: oldError } = await supabase
      .from("workspace_members")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (oldError) throw oldError;

    const actorMembership = await assertWorkspaceRole({
      userId: req.user.id,
      workspaceId: old.workspace_id,
      allowedRoles: ["owner", "admin"],
    });

    if (old.role === "owner" && actorMembership.role !== "owner") {
      throw buildError(403, "Only workspace owner can change another owner role");
    }

    const { data, error } = await supabase
      .from("workspace_members")
      .update({ role })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;

    await audit({
      workspace_id: data.workspace_id,
      actor_id: req.user.id,
      entity_type: "workspace_members",
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

export const removeMember = async (req, res, next) => {
  try {
    const { data: old, error: oldError } = await supabase
      .from("workspace_members")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (oldError) throw oldError;

    const actorMembership = await assertWorkspaceRole({
      userId: req.user.id,
      workspaceId: old.workspace_id,
      allowedRoles: ["owner", "admin"],
    });

    if (old.role === "owner") {
      if (actorMembership.role !== "owner") {
        throw buildError(403, "Only workspace owner can remove another owner");
      }

      const { count, error: ownerCountError } = await supabase
        .from("workspace_members")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", old.workspace_id)
        .eq("role", "owner");

      if (ownerCountError) throw ownerCountError;
      if ((count || 0) <= 1) {
        throw buildError(400, "Cannot remove the last workspace owner");
      }
    }

    const { error } = await supabase
      .from("workspace_members")
      .delete()
      .eq("id", req.params.id);

    if (error) throw error;

    await audit({
      workspace_id: old.workspace_id,
      actor_id: req.user.id,
      entity_type: "workspace_members",
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
