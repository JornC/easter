import { IncomingMessage } from "http";

const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const path = require("path");

const app = express();

const apiProxy = createProxyMiddleware("/api", {
  target: "http://localhost:3000",
  changeOrigin: true,
  pathRewrite: {
    "^/api": "",
  },
  ws: true,
});

// Example project on root
const exampleProxy = createProxyMiddleware("/", {
  target: "http://localhost:5174",
  changeOrigin: true,
  ws: true,
});

// Get absolute path for easter/dist
const easterDistPath = path.resolve(__dirname, "../../../easter/dist");
console.log(`Serving easter files from: ${easterDistPath}`);

// Serve static files from easter/dist directory
app.use("/easter", express.static(easterDistPath));

app.use("/api", apiProxy);
app.use("/", exampleProxy);

const server = app.listen(8080, () => {
  console.log(`Proxy server listening on port 8080`);
});

server.on("upgrade", (req: IncomingMessage, socket: any, head: any) => {
  if (req.url!.startsWith("/api")) {
    apiProxy.upgrade(req, socket, head);
  } else {
    exampleProxy.upgrade(req, socket, head);
  }
});
