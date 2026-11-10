import { verifyToken } from "@clerk/backend"
import { loadEnv } from "./loadEnv.js";

loadEnv();

async function verifyJwt(token) {
  try {
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    })

    return {
      id: payload.sub,
      email: payload.email,
      // workspace_id:
      //   payload.workspace_id || payload.org_role || null,
      // role:
      //   payload.role || payload.org_role || 'member',
    }
  } catch (err) {
    throw new Error('Invalid or expired token')
  }
}

export { verifyJwt };