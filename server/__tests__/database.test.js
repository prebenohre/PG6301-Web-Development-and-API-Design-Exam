import { connectToMongoDB, client } from "../helpers.js";

describe("Database Connection", () => {
	beforeAll(async () => {
		// Ensure the database is connected before running tests
		await connectToMongoDB();
	});

	afterAll(async () => {
		// Close the database connection after all tests
		await client.close();
	});

	test("should connect to the MongoDB database", async () => {
		expect(client.topology.isConnected()).toBe(true);
	});

	test("should access the correct database", async () => {
		const db = client.db("exam_database");
		const collections = await db.listCollections().toArray();
		const collectionNames = collections.map(c => c.name);
		expect(collectionNames).toContain("news");
	});
});
