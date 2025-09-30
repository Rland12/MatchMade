// server.js (or app.js)
import express from "express";
import pairsRouter from "./server/pairs.js";

const app = express();
// ...your existing static + routes...
app.use("/api/pairs", pairsRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 http://localhost:${PORT}`));
