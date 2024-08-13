// helpers.js
import { WebSocketServer, WebSocket } from "ws";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
	console.error("Missing MONGODB_URI environment variable");
	process.exit(1);
}

export const client = new MongoClient(mongoUri);

export const wss = new WebSocketServer({ noServer: true });

export async function connectToMongoDB() {
	try {
		console.log("Connecting to MongoDB...");
		await client.connect();
		console.log("Connected to MongoDB");
		return client.db("exam_database").collection("news");
	} catch (e) {
		console.error(e);
		process.exit(1);
	}
}

export function setupWebSocketServer(httpServer) {
	httpServer.on("upgrade", (request, socket, head) => {
		wss.handleUpgrade(request, socket, head, ws => {
			wss.emit("connection", ws, request);
		});
	});

	wss.on("connection", ws => {
		console.log("New client connected");
		ws.on("close", () => {
			console.log("Client disconnected");
		});
	});
}

export function broadcast(message) {
	wss.clients.forEach(client => {
		if (client.readyState === WebSocket.OPEN) {
			client.send(JSON.stringify(message));
		}
	});
}

export async function fetchGoogleUserInfo(accessToken) {
	const res = await fetch(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${accessToken}`);
	if (!res.ok) {
		throw new Error(`Failed ${res.status}`);
	}
	return await res.json();
}
