const fs = require("fs");
const rl = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout
});

const locales = fs.readdirSync("./locales")
  .map(loc => loc.replace(".json", ""));

function input(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  })
}

async function promptNewString() {
  const stringName = await input("String name? ");
  const stringPath = stringName.split(".");

  console.log("Input now the translations: ");
  for (const locale of locales) {
    const translation = await input(locale + "? ");

    const localeObj = require(`./locales/${locale}.json`);
    let s = localeObj;
    for (let i = 0; i < stringPath.length - 1; ++i) {
      const key = stringPath[i];
      if (!(key in s)) {
        s[key] = {};
      }
      s = s[key];
    }
    s[stringPath[stringPath.length - 1]] = translation;

    const json = JSON.stringify(localeObj, null, "\t") + "\n";
    fs.writeFileSync("./locales/" + locale + ".json", json);
  }
  process.exit(0);
}

promptNewString();
