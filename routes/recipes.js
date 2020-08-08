var express = require('express');
var router = express.Router();

const multer = require('multer');
const upload = multer({ dest: 'public/recipes/images' });
const { validationResult } = require("express-validator")

const { Recipe, bodyValidations } = require('../models/recipe.model.js');
const { Step } = require('../models/step.model.js');

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

/* GET Recipe */
router.get('/:id', parseRecipeId, function(req, res, next) {
	const recipe = Recipe.getById(res.recipeId, { all: true });

	let alerts = [];
	if (req.query.hasOwnProperty("new")) {
		alerts.push({
			content: "Receta creada correctamente.",
			type: "success",
			delay: 10000,
			candismiss: true
		})
	}
	if (req.query.hasOwnProperty("edited")) {
		alerts.push({
			content: "Receta editada correctamente.",
			type: "success",
			delay: 10000,
			candismiss: true
		})
	}
	res.render('recipe', {
		recipe: recipe.formatted(res.locals.locale),
		alerts: alerts,
		locale: res.locals.locale
	});
});

/* GET Recipe edit form */
router.get('/:id/edit', parseRecipeId, function (req, res, next) {
	const recipe = Recipe.getById(res.recipeId, { all: true });

	res.render('edit', {
		recipe: recipe.formatted(res.locals.locale),
		recipeTypes: Recipe.recipeTypes,
		stepTypes: Step.stepTypes,
		locale: res.locals.locale
	});
});

/* POST Recipe (edit) */ // Wanted to use PUT... but this is easier
router.post('/:id', parseRecipeId, upload.single('image'), validate(bodyValidations), function (req, res, next) {
	const recipe = Recipe.fromFormInput(req.body,
		res.recipeId,
		req.file && req.file.filename);

	const deleteImage = req.body.delete_image;
	recipe.update(deleteImage);

	res.redirect(`/recipe/${recipe.id}?edited`);
});

/* POST Recipe (new) */ 
router.post('/', upload.single('image'), validate(bodyValidations), function (req, res, next) {
	let recipe = Recipe.fromFormInput(req.body,
		undefined,
		req.file && req.file.filename);
	const id = recipe.insert();
	
	res.redirect(`/recipe/${id}?new`);
});

/* DELETE Recipe */
router.delete('/:id', parseRecipeId, function (req, res, next) {
	Recipe.deleteById(res.recipeId);
	res.status(200).json({ id: res.recipeId, msg: "delete ok"});
});

module.exports = router;
