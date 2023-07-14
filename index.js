import express, { json, urlencoded } from 'express';
import { completions, chatCompletions, poe2Completions } from './routes.js';
import { corsMiddleware, rateLimitMiddleware } from './middlewares.js';
import { DEBUG, SERVER_PORT } from './config.js';
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
        discord: "https://discord.com/channels/563783473115168788/1129375417673977867"
    });
});
app.post("/v1/completions", completions);
app.post("/v1/chat/completions", chatCompletions);
app.post("/v2/poe/chat/completions", poe2Completions);
app.post("/v2/chatgpt/chat/completions", poe2Completions);

// Start server
app.listen(SERVER_PORT, () => {
    console.log(`Listening on ${SERVER_PORT} ...`);
});
