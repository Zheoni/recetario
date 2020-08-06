const express = require('express');
const router = express.Router();

const { Tag } = require('../models/tag.model.js');
const { Ingredient } = require('../models/ingredient.model.js');

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

module.exports = router;
