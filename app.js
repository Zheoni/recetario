const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const debug = require("debug")("recetario:app");

const { initDB, closeDB } = require("./db");
initDB(process.env.DATABASE_NAME ?? "recipes.db");
debug("Connected to database.");

const { loadQueriesFrom } = require("./queryLoader");
const { getLocale, loadLoacales } = require("./localeLoader.js");

let amount;
amount = loadQueriesFrom("./queries", { recursive: true });
debug("Loaded " + amount + " queries.");

amount = loadLoacales("./locales")
debug("Loaded " + amount + " locales.");

const indexRouter = require('./routes/index.js');
const recipesRouter = require('./routes/recipes.js');
const apiRouter = require('./routes/api.js');
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
app.use(express.static(path.join(__dirname, 'public')));
app.use(function(req, res, next) {
  let locale = process.env.DEFAULT_LOCALE ?? "es";
  if (req.cookies["locale"]) {
    if (["es", "en"].includes(req.cookies["locale"])) {
      locale = req.cookies["locale"];
    } else {
      res.clearCookie("locale");
    }
  }

  res.locals.locale = getLocale(locale);
  return next();
});

app.use('/', indexRouter);
app.use('/recipe', recipesRouter);
app.use('/api', apiRouter);

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
