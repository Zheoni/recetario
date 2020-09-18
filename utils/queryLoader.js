const { getDB } = require("./db.js");
const fs = require("fs");
const path = require("path");
const { SqliteError } = require("better-sqlite3");
const debug = require("debug")("recetario:queryLoader");

const _db = getDB();

const _queries = {};

function loadFromRecursive(directory, recursive = false) {
  const queries = {};
  let numberLoaded = 0;

  fs.accessSync(directory, fs.constants.R_OK);
  const dirents = fs.readdirSync(directory, { withFileTypes: true });
  for (const dirent of dirents) {
    const filePath = path.resolve(directory, dirent.name);
    if (dirent.isDirectory() && recursive) {
      const loaded = loadFromRecursive(filePath);
      queries[dirent.name] = loaded.queries;
      numberLoaded += loaded.numberLoaded;
    } else if (dirent.isFile() && path.extname(dirent.name) === ".sql") {
      fs.accessSync(filePath, fs.constants.R_OK);
      const fileBuffer = fs.readFileSync(filePath);
      const sql = fileBuffer.toString();
      try {
        const statement = _db.prepare(sql);
        queries[path.basename(dirent.name, ".sql")] = statement;
        ++numberLoaded;
      } catch(err) {
        if (err instanceof SqliteError) {
          debug(`Cannot load query at ${filePath}. Error: ${err.message}`);
          process.exit(1);
        } else {
          throw err;
        }
      }
    }
  }

  return { queries, numberLoaded };
}

function loadQueriesFrom(directory, { recursive = false } = {}) {
  const loaded = loadFromRecursive(directory, recursive);
  Object.assign(_queries, loaded.queries);
  return loaded.numberLoaded;
}

function getQueries() {
  return _queries;
}

module.exports = {
  loadQueriesFrom,
  getQueries
}
