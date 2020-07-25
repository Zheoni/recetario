const express = require('express');
const router = express.Router();

const controller = require("../controllers/recipes.controller.js");

router.post('/search', function (req, res, next) {
  let recipes = new Set();
  const limit = req.body.limit || 50;
  if (req.body.name) {
    const name = req.body.name;
    const name_recipes = controller.searchByName(name);
    name_recipes.forEach(recipes.add, recipes);
  }
  res.json({recipes: Array.from(recipes)});
});

module.exports = router;
