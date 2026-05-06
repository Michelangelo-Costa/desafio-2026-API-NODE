import express from "express";
import cors from "cors";
import { getAbsoluteFSPath } from "swagger-ui-dist";
import { swaggerSpec } from "./utils/swagger";
import authRoutes from "./routes/auth.routes";
import speciesRoutes from "./routes/species.routes";

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const isLocalhostOrigin = (origin: string) =>
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      if (origin === "null" && allowedOrigins.includes("null")) {
        return callback(null, true);
      }

      if (
        allowedOrigins.length === 0 &&
        process.env.NODE_ENV !== "production" &&
        isLocalhostOrigin(origin)
      ) {
        return callback(null, true);
      }

      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/docs.json", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

app.get("/docs", (_req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.send(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>SIAPESQ API — Swagger UI</title>
  <link rel="stylesheet" href="/docs/swagger-ui.css" />
  <style>body { margin: 0; }</style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="/docs/swagger-ui-bundle.js"></script>
  <script src="/docs/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = () => {
      SwaggerUIBundle({
        url: "/docs.json",
        dom_id: "#swagger-ui",
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
        layout: "StandaloneLayout",
        persistAuthorization: true,
        defaultModelsExpandDepth: 1,
        docExpansion: "list",
      });
    };
  </script>
</body>
</html>`);
});

app.use("/docs", express.static(getAbsoluteFSPath()));

app.use("/auth", authRoutes);
app.use("/species", speciesRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: "Rota não encontrada" });
});

export default app;
