const express = require('express');
const router = express.Router();

const controller = require("../controllers/recipes.controller.js");

router.get('/autocomplete/ingredient', function (req, res, next) {
  try {
    const { name, limit } = req.query;
    if (name) {
      const ingredients = controller.searchIngredientByName(name, limit);
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
      const tags = controller.searchTagByName(name, limit);
      res.json({ tags });
    } else {
      res.status(400).json({ message: "No name given" });
    }
  } catch(err) {
    res.status(500).json({ message: "Could not process request", error: err })
  }
});

module.exports = router;
