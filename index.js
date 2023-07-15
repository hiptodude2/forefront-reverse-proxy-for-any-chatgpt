import express, { json, urlencoded } from "express";
import {
  completions,
  chatCompletions,
  poe2Completions,
  chatgptCompletion,
} from "./routes.js";
import { corsMiddleware, rateLimitMiddleware } from "./middlewares.js";
import { DEBUG, SERVER_PORT } from "./config.js";
import { tunnel } from "cloudflared";

let app = express();

process.on("uncaughtException", function (err) {
  if (DEBUG) console.error(`Caught exception: ${err}`);
});

// Middlewares
app.use(corsMiddleware);
app.use(rateLimitMiddleware);
app.use(json());
app.use(urlencoded({ extended: true }));

// Register routes
app.all("/", async function (req, res) {
  res.set("Content-Type", "application/json");
  return res.status(200).send({
    status: true,
    github: "https://github.com/4e4f4148/JanitorAI-POE-Proxy",
    discord:
      "https://discord.com/channels/563783473115168788/1129375417673977867",
  });
});
app.post("/v1/completions", completions);
app.post("/v1/chat/completions", chatCompletions);
app.post("/v2/poe/sage/chat/completions", poe2Completions);
app.post("/v2/poe/chatgpt/chat/completions", chatgptCompletion);

const { url, connections, child, stop } = tunnel({
  "--url": `localhost:${SERVER_PORT}`,
});
let baselink = await url;
console.log(
  `[recommend context size < 3000 token]\nPOE REVERSE PROXY URL: ${baselink}/v2/poe/sage`
);
console.log(
  `[recommend context size < 4000 token]\nCHATGPT REVERSE PROXY URL: ${baselink}/v2/poe/chatgpt`
);
console.log(`Proxy is running on PORT ${SERVER_PORT} ...`);

// const conns = await Promise.all(connections);
// console.log("Connections Ready!", conns);
child.on("exit", (code) => {
  console.log("tunnel process exited with code", code);
});

// Start server
app.listen(SERVER_PORT, () => {
  console.log(`LOCAL URL: http://localhost:${SERVER_PORT}/v2/poe/sage`);
  //   console.log(`Proxy is running on PORT ${SERVER_PORT} ...`);
});
