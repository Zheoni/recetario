const assert = require('assert')
const Database = require('better-sqlite3')

let _db;

function initDB() {
  if (_db) {
    console.warn("Trying to init DB again!");
  } else {
    _db = new Database('recipes.db');
  }

  return _db.open;
}

function getDB() {
  assert.ok(_db, "Database has not been initialized.");
  return _db;
}

function closeDB() {
  if (_db) {
    try {
      _db.close();
      console.log("Closed database");
    } catch (err) {
      console.err("Tried to close an already closed database!");
    }
  } else {
    console.warn("Database has not been initialized before trying to close it!")
  }
}

module.exports = { initDB, getDB, closeDB };