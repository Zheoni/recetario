const { getDB } = require("./db.js");
const fs = require("fs");
const path = require("path");

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
      queries[path.basename(dirent.name, ".sql")] = _db.prepare(sql);
      ++numberLoaded;
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
