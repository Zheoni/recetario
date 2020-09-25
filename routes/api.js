const express = require('express');
const router = express.Router();

const { Recipe, JSONValidations, searchValidations } = require("../models/recipe.model.js");
const { validate, parseRecipeId } = require("../utils/utils.js"); 
const { query, oneOf } = require("express-validator");
const { Tag } = require('../models/tag.model.js');
const { Ingredient } = require('../models/ingredient.model.js');
const { buildGraph, isValidCache, findUnit, getAllUnits } = require('../models/unitConversions.js');

router.get('/autocomplete/ingredient', [
  query("name").isString(),
  query("limit").optional().isInt({ min: 0 }).toInt()
], validate, function (req, res, next) {
  try {
    const { name, limit } = req.query;
    const ingredients = Ingredient.searchByName(name, limit);
    res.json({ ingredients });
  } catch(err) {
    res.status(500).json({ message: "Could not process request", error: err });
  }
});

router.get('/autocomplete/tag', [
  query("name").isString(),
  query("limit").optional().isInt({ min: 0 }).toInt()
], validate, function (req, res, next) {
  try {
    const { name, limit } = req.query;
    const tags = Tag.searchByName(name, limit);
    res.json({ tags });
  } catch(err) {
    res.status(500).json({ message: "Could not process request", error: err })
  }
});

router.get('/conversions/find-unit', [
  query("name").isString()
], validate, function (req, res) {
  let { name } = req.query;
  const unit = findUnit(name);
  if (unit) {
    res.json(unit);
  } else {
    res.status(404).json({ message: "Cannot match with any unit" });
  }
});

const graphCache = {
  data: null,
  date: null
}
router.get('/conversions/graph', function (req, res) {
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
router.get('/conversions/units', function (req, res) {
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

router.get('/conversions/up-to-date', [
  query("date").isInt({ min: 1 }),
  query("name").isString().isAlpha().isAscii()
], validate, function (req, res) {
  const { name, date } = req.query;

  res.set('Cache-Control', 'no-store')
    .json({ valid: isValidCache(date, name) });
});

router.get('/recipe/:id', parseRecipeId, function (req, res) {
  const recipe = Recipe.getById(res.recipeId, { all: true });
  res.json(recipe);
});

router.post('/recipe', JSONValidations, validate, function (req, res) {
  const recipe = Recipe.fromJSONData(req.body);
  const recipeID = recipe.insert();
  const newRecipe = Recipe.getById(recipeID, { all: true });
  res.json(newRecipe);
});

router.get('/search', searchValidations, validate, function (req, res) {
  const { name, authors, types,
    tags, cookingTime, ingredients,
    limit, sort, attributes } = req.query;

  let attributesObject = {};
  if (attributes) {
    attributesObject = {
      all: attributes.includes("all"),
      loadIngredients: attributes.includes("ingredients"),
      loadTags: attributes.includes("tags"),
      loadSteps: attributes.includes("steps")
    }
  }

  const results = Recipe.search({
    name, authors, types, tags, cookingTime, ingredients
  }, {
    sort, limit, attributes: attributesObject
  });

  res.json(results);
});

module.exports = router;
