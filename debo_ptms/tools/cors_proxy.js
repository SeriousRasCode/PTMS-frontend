// Minimal CORS reverse proxy for local dev.
// Usage: node tools/cors_proxy.js
// Proxies http://localhost:3334/*  ->  http://localhost:3333/*

import http from "node:http";
import { URL } from "node:url";

const TARGET = new URL(process.env.TARGET_URL || "http://localhost:3333");
const PORT = Number(process.env.PROXY_PORT || 3334);

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

const server = http.createServer((req, res) => {
  setCors(res);

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  const upstreamUrl = new URL(req.url || "/", TARGET);

  const upstreamReq = http.request(
    upstreamUrl,
    {
      method: req.method,
      headers: {
        ...req.headers,
        host: TARGET.host,
      },
    },
    (upstreamRes) => {
      setCors(res);
      res.statusCode = upstreamRes.statusCode || 502;

      // Copy upstream headers except ones that conflict.
      for (const [key, value] of Object.entries(upstreamRes.headers)) {
        if (!value) continue;
        const lower = key.toLowerCase();
        if (lower === "access-control-allow-origin") continue;
        if (lower === "access-control-allow-methods") continue;
        if (lower === "access-control-allow-headers") continue;
        res.setHeader(key, value);
      }

      upstreamRes.pipe(res);
    },
  );

  upstreamReq.on("error", (err) => {
    res.statusCode = 502;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        message:
          `Proxy could not reach backend at ${TARGET.toString()}. ` +
          `Is it running? (${err.message})`,
      }),
    );
  });

  req.pipe(upstreamReq);
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`CORS proxy listening on http://localhost:${PORT}`);
  console.log(`Proxying -> ${TARGET.toString()}`);
});
