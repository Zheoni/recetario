const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const helmet = require('helmet')
const debug = require("debug")("recetario:app");

const { initDB, closeDB } = require("./utils/db.js");
const databasePath = path.join(process.env.DATABASE_DIR ?? ".", process.env.DATABASE_NAME ?? "recipes.db");
initDB(databasePath);
debug("Connected to database.");

const { loadQueriesFrom } = require("./utils/queryLoader.js");
const { getLocale, loadLoacales, availableLocales } = require("./utils/localeLoader.js");

let amount;
amount = loadQueriesFrom("./queries", { recursive: true });
debug("Loaded " + amount + " queries.");

amount = loadLoacales("./locales")
debug("Loaded " + amount + " locales.");

const indexRouter = require('./routes/index.js');
const recipesRouter = require('./routes/recipes.js');
const apiRouter = require('./routes/api.js');
const dependenciesRouter = require('./routes/dependecies.js');
debug("Loaded routers.");

debug("Configuring app...");
const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

if (process.env.USE_LOGGER !== "false")
  app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(helmet());
app.use(express.static(path.join(__dirname, 'public')));
app.locals.locale = process.env.DEFAULT_LOCALE ?? "en";
app.locals.availableLocales = availableLocales().map((loc) => loc.code);
app.use(function(req, res, next) {
  let locale = req.acceptsLanguages(app.locals.availableLocales);
  let cookieLocale = req.cookies["locale"];
  if (cookieLocale) {
    if (app.locals.availableLocales.includes(req.cookies["locale"])) {
      locale = req.cookies["locale"];
    } else if (cookieLocale === "_default") {
      locale = app.locals.locale;
    } else {
      locale = false;
      res.clearCookie("locale");
    }
  } else if (locale === false) {
    locale = app.locals.locale
  }
  res.locals.locale = getLocale(locale);
  return next();
});

app.use('/', indexRouter);
app.use('/recipe', recipesRouter);
app.use('/api', apiRouter);
app.use('/vendor', dependenciesRouter);
app.use('/fonts', express.static(path.join(__dirname,
  "vendor", "boxicons", "fonts"), {
  immutable: true,
  maxAge: 604800
}));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

debug("App configured!");

// close db on exit
process.on('exit', () => closeDB());

module.exports = app;
