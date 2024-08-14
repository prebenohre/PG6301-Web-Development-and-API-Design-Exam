// __tests__/import.test.js

import { client } from "../helpers.js";

describe("Import statement test", () => {
	test("should successfully import client from helpers.js", () => {
		expect(client).toBeDefined();
	});
});
