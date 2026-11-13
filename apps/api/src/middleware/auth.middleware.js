// Supabase JWT authentication middleware
import { verifyJwt } from "../utils/jwtVerifier.js";

export default async function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Missing or invalid Authorization header',
            })
        }

        const token = authHeader.split(' ')[1];

        const user = await verifyJwt(token);

        // if (!user) {
        //     return res.status(401).json({
        //         error: 'Invalid or expired token',
        //     })
        // }

        req.user = {
            id: user.id,
            email: user.email,
            // workspace_id: user.workspace_id,
            // role: user.role,
        }

        next();

    } catch (err) {
        return res.status(401).json({
            error: 'Invalid or expired token',
        })
    }
};
