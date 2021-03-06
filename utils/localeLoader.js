const fs = require("fs");
const path = require("path");
const debug = require("debug")("recetario:localeLoader")

const _locales = {};

function loadLoacales(directory) {
  let count = 0;
  fs.readdirSync(directory, { withFileTypes: true })
    .filter(dirent => dirent.isFile() && dirent.name.endsWith(".json"))
    .forEach(file => {
      try {
        const fullPath = path.resolve(directory, file.name);
        const localeObject = require(fullPath);
        _locales[localeObject.locale] = localeObject;
        ++count;
      } catch(err) {
        debug(`Cannot load locale ${file.name}. Error: ${err.message}`);
      }
    });
  return count;
}

function getLocale(name) {
  return _locales[name];
}

function availableLocales() {
  const available = [];
  for (const locale in _locales) {
    available.push({ code: locale, language: _locales[locale].language });
  }

  return available;
}

module.exports = {
  loadLoacales,
  getLocale,
  availableLocales
};
