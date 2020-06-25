#!/usr/bin/env node

const Database = require('better-sqlite3');
const fs = require('fs');


if (fs.existsSync('recipes.db')) {
	if (process.argv.includes("--force")) {
		fs.unlinkSync('recipes.db');
	} else {
		console.log("Database exists, exiting script");
		process.exit(0);
	}
}

console.log("Creating database file...")

const db = new Database('recipes.db');
	
console.log("Reading input file...")
const file = "models/recipes.sql";
const queries = fs.readFileSync(file, 'utf8');
	
console.log("Creating table...")
db.exec(queries)

console.log("Closing database...")
db.close();
