const express = require('express');
const router = express.Router();

const { query, validationResult } = require("express-validator");
const { Tag } = require('../models/tag.model.js');
const { Ingredient } = require('../models/ingredient.model.js');
const { buildGraph, isValidCache, findUnit, getAllUnits } = require('../models/unitConversions.js');

router.get('/autocomplete/ingredient', function (req, res, next) {
  try {
    const { name, limit } = req.query;
    if (name) {
      const ingredients = Ingredient.searchByName(name, limit);
      res.json({ ingredients });
    } else {
      res.status(400).json({ message: "No name given" });
    }
  } catch(err) {
    res.status(500).json({ message: "Could not process request", error: err });
  }
});

router.get('/autocomplete/tag', function (req, res, next) {
  try {
    const { name, limit } = req.query;
    if (name) {
      const tags = Tag.searchByName(name, limit);
      res.json({ tags });
    } else {
      res.status(400).json({ message: "No name given" });
    }
  } catch(err) {
    res.status(500).json({ message: "Could not process request", error: err })
  }
});

router.get('/conversions/find-unit', function (req, res, next) {
  let { name } = req.query;
  if (name) {
    const unit = findUnit(name);
    if (unit) {
      res.json(unit);
    } else {
      res.status(404).json({ message: "Cannot match with any unit" });
    }
  } else {
    res.status(400).json({ message: "Need a name to find the unit" });
  }
});

const graphCache = {
  data: null,
  date: null
}
router.get('/conversions/graph', function (req, res, next) {
  try {
    if (graphCache.data === null || !isValidCache(graphCache.date, "conversions")) {
      graphCache.data = JSON.stringify(buildGraph());
      graphCache.date = Date.now();
    }
    res.set('Content-Type', 'application/json').send(graphCache.data);
  } catch(err) {
    res.status(500).json({ message: "Could not process request", error: err })
  }
});

const unitsCache = {
  data: null,
  date: null
}
router.get('/conversions/units', function (req, res, next) {
  try {
    if (unitsCache.data === null || !isValidCache(unitsCache.date, "units")) {
      unitsCache.data = JSON.stringify({ units: getAllUnits() });
      unitsCache.date = Date.now();
    }
    res.set('Content-Type', 'application/json').send(unitsCache.data);
  } catch(err) {
    res.status(500).json({ message: "Could not process request", error: err })
  }
});

router.get('/conversions/up-to-date', function (req, res, next) {
  const { name, date } = req.query;

  res.set('Cache-Control', 'no-store')
    .json({ valid: isValidCache(date, name) });
});

module.exports = router;
