#!/usr/bin/env node

const Database = require('better-sqlite3');
const fs = require('fs');
require("dotenv").config();

const databaseName = process.env.DATABASE_NAME ?? "recipes.db";

if (fs.existsSync(databaseName)) {
	if (process.argv.includes("--force")) {
		fs.unlinkSync(databaseName);
	} else {
		console.log("Database exists, exiting script");
		process.exit(0);
	}
}

console.log("Creating database file...")

const db = new Database(databaseName);
	
console.log("Reading input file...")
const file = "models/recipes.sql";
const queries = fs.readFileSync(file, 'utf8');
	
console.log("Creating table...")
db.exec(queries)

const timestamp = Date.now();
db.prepare("UPDATE UNITS_LAST_UPDATE SET time = ?").run(timestamp);

console.log("Closing database...")
db.close();
