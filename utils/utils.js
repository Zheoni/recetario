const { validationResult } = require("express-validator");
const { Recipe } = require("../models/recipe.model.js"); 

function validate(validations) {
	return async (req, res, next) => {
		await Promise.all(validations.map(validation => validation.run(req)));

		const errors = validationResult(req);
		if (errors.isEmpty()) {
			return next();
		}

		res.status(400).json({ errors: errors.array() });
	};
}

function bundleLocales(strings) {
	return function (req, res, next) {
		const bundle = {};
		strings.forEach(string => {
			const route = string.split(".");
			let current = res.locals.locale;

			route.forEach(name => {
				current = current[name]
			});
			bundle[string] = current;
    });
		res.locals.bundledLocales = bundle;
		return next()
	}
}

function parseRecipeId(req, res, next) {
  const id = Number(req.params.id);
  if (id && typeof id === "number" && id !== undefined) {
    const exists = Recipe.checkIfExists(id);
    if (exists) {
      res.recipeId = id;
      return next();
    } else {
      res.status(404).json({ error: "Recipe not found" });
    }
  } else {
    res.status(400).json({ error: "Bad recipe id" });
  }
}

module.exports = {
  validate,
	bundleLocales,
	parseRecipeId
}
