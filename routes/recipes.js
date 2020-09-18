var express = require('express');
var router = express.Router();

const multer = require('multer');
const upload = multer({ dest: 'public/recipes/images' });

const { Recipe, bodyValidations } = require('../models/recipe.model.js');
const { Step } = require('../models/step.model.js');
const { bundleLocales, parseRecipeId, validate } = require("../utils/utils.js");

/* GET Recipe */
router.get('/:id', parseRecipeId, bundleLocales([
	"alerts.recipeDeleted",
	"alerts.recipeDeleteError",
	"recipeView.confirmDelete"
]), function (req, res, next) {
	const recipe = Recipe.getById(res.recipeId, { all: true });

	let alerts = [];
	if (req.query.hasOwnProperty("new")) {
		alerts.push({
			content: res.locals.locale.alerts.recipeCreated,
			type: "success",
			delay: 10000,
			candismiss: true
		})
	}
	if (req.query.hasOwnProperty("edited")) {
		alerts.push({
			content: res.locals.locale.alerts.recipeEdited,
			type: "success",
			delay: 10000,
			candismiss: true
		})
	}
	res.render('recipe', {
		recipe: recipe,
		alerts: alerts
	});
});

/* GET Recipe edit form */
router.get('/:id/edit', parseRecipeId, bundleLocales([
	"alerts.reviewRecipeForm"
]), function (req, res, next) {
	const recipe = Recipe.getById(res.recipeId, { all: true });

	res.render('edit', {
		recipe: recipe,
		recipeTypes: Recipe.recipeTypes,
		stepTypes: Step.stepTypes
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
	res.status(200).json({ id: res.recipeId, msg: "delete ok" });
});

module.exports = router;
