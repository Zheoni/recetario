const locales = {};

function getLocale(name) {
  if (!locales[name]) {
    const path = `./locales/${name}.json`;
    locales[name] = require(path);
  }

  return locales[name];
}

module.exports = { getLocale };
