// Local verification fixture only. It keeps the existing middleware path intact
// without contacting or configuring any real Supabase project.
import http from "node:http"
import { spawn } from "node:child_process"

const fixture = http.createServer((request, response) => {
  response.setHeader("Content-Type", "application/json")
  response.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:3132")
  response.setHeader("Access-Control-Allow-Headers", "authorization, apikey, content-type, x-client-info, x-supabase-api-version")
  response.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS")

  if (request.method === "OPTIONS") {
    response.writeHead(204)
    response.end()
    return
  }

  if (request.url?.startsWith("/auth/v1/user")) {
    response.writeHead(401)
    response.end(JSON.stringify({ message: "Local anonymous browser fixture" }))
    return
  }

  response.writeHead(404)
  response.end("{}")
})

fixture.listen(3133, "127.0.0.1")

const mode = process.env.TEST_SERVER_MODE === "production" ? "start" : "dev"
const next = spawn(process.execPath, ["node_modules/next/dist/bin/next", mode, "--hostname", "127.0.0.1", "--port", "3132"], {
  stdio: "inherit",
  windowsHide: true,
  env: {
    ...process.env,
    NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:3133",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "public-local-browser-placeholder",
    NEXT_TELEMETRY_DISABLED: "1",
  },
})

let stopping = false
function stop() {
  if (stopping) return
  stopping = true
  next.kill()
  fixture.close(() => process.exit(0))
  setTimeout(() => process.exit(0), 2_000).unref()
}

next.on("exit", (code) => {
  fixture.close(() => process.exit(code ?? 1))
})
process.on("SIGINT", stop)
process.on("SIGTERM", stop)
