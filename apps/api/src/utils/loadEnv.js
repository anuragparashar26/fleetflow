import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

let loaded = false;

export function loadEnv() {
  if (loaded) return;

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const apiRoot = path.resolve(__dirname, "../../");
  const nodeEnv = process.env.NODE_ENV || "development";
  const envCandidates = [
    path.join(apiRoot, ".env"),
    path.join(apiRoot, `.env.${nodeEnv}`),
    path.join(apiRoot, ".env.local"),
  ];

  const loadedAny = envCandidates.reduce((didLoad, envPath) => {
    if (!fs.existsSync(envPath)) {
      return didLoad;
    }

    dotenv.config({ path: envPath, override: true });
    return true;
  }, false);

  if (!loadedAny) {
    throw new Error(
      "Missing API env file. Create apps/api/.env from apps/api/.env.example."
    );
  }

  loaded = true;
}
