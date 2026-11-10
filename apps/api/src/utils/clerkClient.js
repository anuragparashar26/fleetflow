import { createClerkClient } from "@clerk/backend";
import { loadEnv } from "./loadEnv.js";

loadEnv();

if (!process.env.CLERK_SECRET_KEY) {
  throw new Error("Missing CLERK_SECRET_KEY in apps/api/.env");
}

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

export default clerkClient;
