// server.js
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import path from "path";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { connectToMongoDB, setupWebSocketServer } from "./helpers.js";
import { createNewsRoutes, createAuthRoutes } from "./routes.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);

app.use(cors());
app.use(bodyParser.json());
app.use(cookieParser(process.env.COOKIE_SECRET));

setupWebSocketServer(httpServer);

async function startServer() {
	const newsCollection = await connectToMongoDB();

	app.use("/api/news", createNewsRoutes(newsCollection));
	app.use("/api", createAuthRoutes());

	app.use(express.static(path.join("../client/dist/")));

	app.use((req, res, next) => {
		if (req.method === "GET" && !req.path.startsWith("/api/")) {
			return res.sendFile(path.resolve("../client/dist/index.html"));
		} else {
			next();
		}
	});

	const server = httpServer.listen(process.env.PORT || 3000, () => {
		console.log(`Express server started on http://localhost:${server.address().port}`);
	});
}

startServer();
