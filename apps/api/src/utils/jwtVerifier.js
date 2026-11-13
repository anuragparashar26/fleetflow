import { loadEnv } from "./loadEnv.js";
import supabase from "./supabaseClient.js";

loadEnv();

async function verifyJwt(token) {
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) throw new Error("Invalid or expired token");

  return {
    id: data.user.id,
    email: data.user.email,
  };
}

export { verifyJwt };