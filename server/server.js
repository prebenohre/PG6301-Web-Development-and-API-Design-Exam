import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import path from "path";
import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import cookieParser from "cookie-parser";
import fetch from "node-fetch";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const wss = new WebSocketServer({ noServer: true });

app.use(cors());
app.use(bodyParser.json());
app.use(cookieParser(process.env.COOKIE_SECRET));

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
	console.error("Missing MONGODB_URI environment variable");
	process.exit(1);
}

console.log(`Using MongoDB URI: ${mongoUri}`);
const client = new MongoClient(mongoUri);

let newsCollection;

function broadcast(message) {
	wss.clients.forEach(client => {
		if (client.readyState === WebSocket.OPEN) {
			client.send(JSON.stringify(message));
		}
	});
}

httpServer.on("upgrade", (request, socket, head) => {
	wss.handleUpgrade(request, socket, head, ws => {
		wss.emit("connection", ws, request);
	});
});

async function startServer() {
	try {
		console.log("Connecting to MongoDB...");
		await client.connect();
		newsCollection = client.db("exam_database").collection("news");
		console.log("Connected to MongoDB");

		wss.on("connection", ws => {
			console.log("New client connected");
			ws.on("close", () => {
				console.log("Client disconnected");
			});
		});

		// Start server
		const server = httpServer.listen(process.env.PORT || 3000, () => {
			console.log(`Express server started on http://localhost:${server.address().port}`);
		});
	} catch (e) {
		console.error(e);
		process.exit(1);
	}
}

async function fetchJSON(url, options) {
	const res = await fetch(url, options);
	if (!res.ok) {
		throw new Error(`Failed ${res.status}`);
	}
	return await res.json();
}

async function fetchGoogleUserInfo(accessToken) {
	return await fetchJSON(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${accessToken}`);
}

app.get("/api/login", async (req, res) => {
	const { access_token } = req.signedCookies;

	if (!access_token) {
		return res.status(401).send("No access token found");
	}

	try {
		const userinfo = await fetchGoogleUserInfo(access_token);
		res.json(userinfo);
	} catch (error) {
		console.error("Error fetching Google user info:", error);
		res.status(401).send("Failed to fetch user info from Google");
	}
});

app.post("/api/login", (req, res) => {
	const { access_token } = req.body;
	console.log("Received access token:", access_token);
	res.cookie("access_token", access_token, {
		signed: true,
		secure: process.env.NODE_ENV === "production",
		httpOnly: true,
	});
	res.sendStatus(200);
});

// Legg til logout-endpoint
app.post("/api/logout", (req, res) => {
	res.clearCookie("access_token");
	res.sendStatus(200);
});

// Endepunkter for news
app.get("/api/news", async (req, res) => {
	if (!newsCollection) {
		return res.status(500).send("Database not connected");
	}
	const news = await newsCollection.find({}).toArray();
	res.json(news);
});

app.get("/api/news/:id", async (req, res) => {
	if (!newsCollection) {
		return res.status(500).send("Database not connected");
	}
	const { id } = req.params;
	try {
		const article = await newsCollection.findOne({ _id: new ObjectId(id) });
		if (!article) {
			return res.status(404).send("News article not found");
		}
		res.status(200).json(article);
	} catch (error) {
		return res.status(400).send("Invalid ID format");
	}
});

app.post("/api/news", async (req, res) => {
	if (!newsCollection) {
		return res.status(500).send("Database not connected");
	}

	const { access_token } = req.signedCookies;
	if (!access_token) {
		return res.status(401).send("Not authenticated");
	}

	try {
		const userinfo = await fetchGoogleUserInfo(access_token);
		const { title, content, timestamp } = req.body;
		const newArticle = { title, content, timestamp, author: userinfo.name };
		const result = await newsCollection.insertOne(newArticle);
		const articleWithId = { _id: result.insertedId, ...newArticle };
		broadcast({ type: "newsAdded", data: articleWithId });
		res.status(201).json(articleWithId);
	} catch (error) {
		console.error("Error adding news article:", error);
		res.status(500).send("Failed to add news article");
	}
});

app.put("/api/news/:id", async (req, res) => {
	if (!newsCollection) {
		return res.status(500).send("Database not connected");
	}

	const { id } = req.params;
	const { title, content } = req.body;

	const { access_token } = req.signedCookies;
	if (!access_token) {
		return res.status(401).send("Not authenticated");
	}

	try {
		const userinfo = await fetchGoogleUserInfo(access_token);
		const username = userinfo.name;

		const article = await newsCollection.findOne({ _id: new ObjectId(id) });
		if (!article) {
			return res.status(404).send("News article not found");
		}
		if (article.author !== username) {
			return res.status(403).send("Forbidden");
		}
		await newsCollection.updateOne({ _id: new ObjectId(id) }, { $set: { title, content } });
		const updatedArticle = await newsCollection.findOne({ _id: new ObjectId(id) });
		broadcast({ type: "newsUpdated", data: updatedArticle });
		res.status(200).json(updatedArticle);
	} catch (error) {
		console.error("Error updating news article:", error);
		res.status(400).send("Invalid ID format or failed to update");
	}
});

app.delete("/api/news/:id", async (req, res) => {
	if (!newsCollection) {
		return res.status(500).send("Database not connected");
	}
	const { id } = req.params;

	const { access_token } = req.signedCookies;
	if (!access_token) {
		return res.status(401).send("Not authenticated");
	}

	try {
		const userinfo = await fetchGoogleUserInfo(access_token);
		const username = userinfo.name;

		const article = await newsCollection.findOne({ _id: new ObjectId(id) });
		if (!article) {
			return res.status(404).send("News article not found");
		}
		if (article.author !== username) {
			return res.status(403).send("Forbidden");
		}
		await newsCollection.deleteOne({ _id: new ObjectId(id) });
		broadcast({ type: "newsDeleted", data: { _id: id } });
		res.sendStatus(204);
	} catch (error) {
		console.error("Error deleting news article:", error);
		res.status(400).send("Invalid ID format or failed to delete");
	}
});

app.use(express.static(path.join("../client/dist/")));

app.use((req, res, next) => {
	if (req.method === "GET" && !req.path.startsWith("/api/")) {
		return res.sendFile(path.resolve("../client/dist/index.html"));
	} else {
		next();
	}
});

startServer();
