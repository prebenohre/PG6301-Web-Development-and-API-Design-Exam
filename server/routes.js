// routes.js
import express from "express";
import { ObjectId } from "mongodb";
import { fetchGoogleUserInfo, broadcast } from "./helpers.js";

export function createNewsRoutes(newsCollection) {
	const router = express.Router();

	router.get("/", async (req, res) => {
		const news = await newsCollection.find({}).toArray();
		res.json(news);
	});

	router.get("/:id", async (req, res) => {
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

	router.post("/", async (req, res) => {
		const { access_token } = req.signedCookies;
		if (!access_token) {
			return res.status(401).send("Not authenticated");
		}

		try {
			const userinfo = await fetchGoogleUserInfo(access_token);
			const { title, content, category, timestamp } = req.body;

			// Sjekk om en artikkel med samme tittel allerede eksisterer
			const existingArticle = await newsCollection.findOne({ title: title });
			if (existingArticle) {
				return res.status(400).json({ message: "An article with this title already exists" });
			}

			const newArticle = {
				title,
				content,
				category,
				timestamp,
				author: userinfo.name,
				authorPicture: userinfo.picture, // Legg til forfatterens profilbilde
			};
			const result = await newsCollection.insertOne(newArticle);
			const articleWithId = { _id: result.insertedId, ...newArticle };
			broadcast({ type: "newsAdded", data: articleWithId });
			res.status(201).json(articleWithId);
		} catch (error) {
			console.error("Error adding news article:", error);
			res.status(500).send("Failed to add news article");
		}
	});

	router.put("/:id", async (req, res) => {
		const { id } = req.params;
		const { title, content, category } = req.body;
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
			await newsCollection.updateOne({ _id: new ObjectId(id) }, { $set: { title, content, category } });
			const updatedArticle = await newsCollection.findOne({ _id: new ObjectId(id) });
			broadcast({ type: "newsUpdated", data: updatedArticle });
			res.status(200).json(updatedArticle);
		} catch (error) {
			console.error("Error updating news article:", error);
			res.status(400).send("Invalid ID format or failed to update");
		}
	});

	router.delete("/:id", async (req, res) => {
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

	return router;
}

export function createAuthRoutes() {
	const router = express.Router();

	router.get("/login", async (req, res) => {
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

	router.post("/login", (req, res) => {
		const { access_token } = req.body;
		console.log("Received access token:", access_token);
		res.cookie("access_token", access_token, {
			signed: true,
			secure: process.env.NODE_ENV === "production",
			httpOnly: true,
		});
		res.sendStatus(200);
	});

	router.post("/logout", (req, res) => {
		res.clearCookie("access_token");
		res.sendStatus(200);
	});

	return router;
}
