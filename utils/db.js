const assert = require('assert')
const Database = require('better-sqlite3')
const debug = require("debug")("recetario:db");

let _db;

function initDB(databaseName, verbose = false) {
  if (_db) {
    debug("WARNING: Tried to initialize DB again!")
  } else {
    if (verbose) {
      _db = new Database(databaseName, { verbose: console.log, fileMustExist: true });
    } else {
      _db = new Database(databaseName, { fileMustExist: true });
    }
  }

  debug("Initialized database, new status: %o", _db.open)

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
      debug("Closed database");
      if (!debug.enabled) console.log("Closed database");
    } catch (err) {
      debug("ERROR: Tried to close an already closed database!")
    }
  } else {
    debug("WARNING: Database has not been initialized before trying to close it!")
  }
}

module.exports = { initDB, getDB, closeDB };
