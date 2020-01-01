#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

console.log("Opening database...")

const db = new sqlite3.Database('recipes.db', (err) => {
	if (err) console.error(err);
	
	console.log("Reading input file...")
	const file = "models/recipes.sql";
	const query = fs.readFileSync(file).toString();
	
	console.log("Creating table...")
	db.run(query);

	console.log("Closing database...")
	db.close();
});
