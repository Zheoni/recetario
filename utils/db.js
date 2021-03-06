const assert = require('assert');
const Database = require('better-sqlite3');
const debug = require("debug")("recetario:db");
const fs = require('fs');

let _db = null;

function initDB(databaseName, options) {
  if (_db) {
    debug("WARNING: Tried to initialize DB again!")
  } else {
    options = Object.assign({}, {
      fileMustExist: true
    }, options);
    _db = new Database(databaseName, options);

    // Load all extensions 
    if (fs.existsSync("ext")) {
      const dir = fs.readdirSync("ext");
      dir.forEach(ext => {
        debug("Loading SQLite extension: " + ext)
        _db.loadExtension("ext/" + ext)
      });
      if (dir.length == 0) debug("No extensions to load in ext dir")
    } else {
      debug("Extensions dir not found")
    }
    _db.pragma("foreign_keys = 1");
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
      assert.ok(!_db.open);
      _db = null;
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
