/* global process */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const BLOCKED_BROWSER_ENV_NAME = /^(VITE_.*(SECRET|PRIVATE|PASSWORD|DATABASE|DIRECT_URL|SERVICE_ROLE|CLERK_SECRET|SUPABASE_SECRET|ACCESS_TOKEN|REFRESH_TOKEN).*)$/i

function blockSecretLikeViteEnv() {
  return {
    name: 'block-secret-like-vite-env',
    configResolved(config) {
      if (config.command !== 'build' || config.mode !== 'production') {
        return
      }

      const blockedKeys = Object.keys(process.env).filter((key) =>
        BLOCKED_BROWSER_ENV_NAME.test(key)
      )

      if (blockedKeys.length > 0) {
        throw new Error(
          `Blocked unsafe browser env keys in production build: ${blockedKeys.join(', ')}`
        )
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), blockSecretLikeViteEnv()],
})
