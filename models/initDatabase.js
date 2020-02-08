#!/usr/bin/env node

const Database = require('better-sqlite3');
const fs = require('fs');


if (fs.existsSync('recipes.db')) {
	console.log("Database exists, exiting script");
	process.exit(0);
}

console.log("Creating database file...")

const db = new Database('recipes.db');
	
console.log("Reading input file...")
const file = "models/recipes.sql";
const query = fs.readFileSync(file).toString();
	
console.log("Creating table...")
db.prepare(query).run();

console.log("Closing database...")
db.close();
