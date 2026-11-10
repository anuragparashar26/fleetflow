// Role-based access control middleware
import supabase from "../utils/supabaseClient.js";

const allowRoles = (...roles) => {
    return async (req, res, next) => {
        try {
            const acceptedRoles = roles.flat();
            const clerkUserId = req.user?.id || req.auth?.userId;

            if (!clerkUserId) {
                return res.status(401).json({
                    message: 'Unauthorized: missing authenticated user',
                })
            }

            const workspaceId =
                (typeof req.headers['x-workspace-id'] === 'string' && req.headers['x-workspace-id'].trim()) ||
                req.body?.workspace_id ||
                req.query?.workspace_id;

            let role = null;
            let error = null;

            if (workspaceId) {
                const result = await supabase
                    .from('workspace_members')
                    .select('role')
                    .eq('workspace_id', workspaceId)
                    .eq('user_id', clerkUserId)
                    .maybeSingle();
                role = result.data?.role || null;
                error = result.error;
            } else {
                const result = await supabase
                    .from('workspace_members')
                    .select('role')
                    .eq('user_id', clerkUserId)
                    .in('role', acceptedRoles)
                    .limit(1)
                    .maybeSingle();
                role = result.data?.role || null;
                error = result.error;
            }

            if (error || !role || !acceptedRoles.includes(role)) {
                return res.status(403).json({
                    message: 'Access denied: Insufficient permissions',
                })
            }

            req.userRole = role;
            next();
        
        } catch (err) {
            next(err);
        }
    }
}

export default allowRoles;