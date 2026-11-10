import supabase from "../../../utils/supabaseClient.js"
import clerkClient from "../../../utils/clerkClient.js"

const VALID_ROLES = ["owner", "admin", "manager", "member"]

const applyPendingWorkspaceInvite = async (clerkUserId) => {
    try {
        const clerkUser = await clerkClient.users.getUser(clerkUserId)
        const metadata = clerkUser?.publicMetadata || {}

        const invitedWorkspaceId = typeof metadata.invited_workspace_id === "string"
            ? metadata.invited_workspace_id.trim()
            : ""

        if (!invitedWorkspaceId) {
            return
        }

        const invitedRoleRaw = typeof metadata.invited_workspace_role === "string"
            ? metadata.invited_workspace_role.trim().toLowerCase()
            : "member"
        const invitedRole = VALID_ROLES.includes(invitedRoleRaw) ? invitedRoleRaw : "member"

        const { data: existingMembership, error: existingMembershipError } = await supabase
            .from("workspace_members")
            .select("id")
            .eq("workspace_id", invitedWorkspaceId)
            .eq("user_id", clerkUserId)
            .maybeSingle()

        if (existingMembershipError) throw existingMembershipError

        if (!existingMembership) {
            const { error: insertMembershipError } = await supabase
                .from("workspace_members")
                .insert([
                    {
                        workspace_id: invitedWorkspaceId,
                        user_id: clerkUserId,
                        role: invitedRole,
                    },
                ])

            if (insertMembershipError) throw insertMembershipError
        }

        const nextMetadata = {
            ...metadata,
        }
        delete nextMetadata.invited_workspace_id
        delete nextMetadata.invited_workspace_role
        delete nextMetadata.invited_by

        await clerkClient.users.updateUserMetadata(clerkUserId, {
            publicMetadata: nextMetadata,
        })
    } catch (err) {
        // Do not block profile sync on invite-accept failures.
        console.error("Failed to apply pending workspace invite", err)
    }
}

export const syncUser = async (req) => {
    const clerkUserId = req.user.id

    const { email, full_name, username, phone } = req.body

    const { data: existingProfile, error: existingError } = await supabase
        .from('profiles')
        .select('email, full_name, username, phone')
        .eq('clerk_user_id', clerkUserId)
        .maybeSingle()

    if (existingError) throw existingError

    const mergedProfile = {
        clerk_user_id: clerkUserId,
        email: email || existingProfile?.email || null,
        full_name: full_name ?? existingProfile?.full_name ?? null,
        username: username ?? existingProfile?.username ?? null,
        phone: phone ?? existingProfile?.phone ?? null,
        updated_at: new Date().toISOString(),
    }

    if (typeof mergedProfile.full_name === 'string' && mergedProfile.full_name.trim() === '') {
        mergedProfile.full_name = existingProfile?.full_name ?? null
    }

    if (typeof mergedProfile.username === 'string' && mergedProfile.username.trim() === '') {
        mergedProfile.username = existingProfile?.username ?? null
    }

    if (typeof mergedProfile.phone === 'string' && mergedProfile.phone.trim() === '') {
        mergedProfile.phone = existingProfile?.phone ?? null
    }

    const { data, error } = await supabase
        .from('profiles')
        .upsert(
            mergedProfile,
            {
                onConflict: 'clerk_user_id',
            }
        )
        .select()
        .single()

    if (error) throw error

    await applyPendingWorkspaceInvite(clerkUserId)

    return data
}

// export const getMe = async (req, res, next) => {
//     try {
//         const { data, error } = await supabase
//             .from('profiles')
//             .select('*')
//             .eq('clerk_user_id', req.user.id)
//             .single()

//         if (error) {
//             return res.status(404).json({
//                 error: 'Profile not found',
//             })
//         }

//         res.json(data)

//     } catch (error) {
//         next(error)
//     }
// }

export const getMe = async (userId) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('clerk_user_id', userId)
            .single()

        if (error) {
            const notFoundError = new Error("profile not found")
            notFoundError.status = 404
            throw notFoundError
        }

        return data
}