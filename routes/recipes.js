var express = require('express');
var router = express.Router();

const multer = require('multer');
const upload = multer({ dest: 'public/recipes/images' });
const assert = require("assert");

const { Recipe, JSONValidations } = require('../models/recipe.model.js');
const { Step } = require('../models/step.model.js');
const { bundleLocales, parseRecipeId, validate } = require("../utils/utils.js");

function transFormRequestBody(req, res, next) {
	let data = {};
	const body = req.body;
	try {
		data.name = body.name;
		data.author = body.author;
		data.description = body.description;
		data.tags = body.tags
			.split(",")
			.filter(t => t.length > 0)
			.map(tag => {
				return { name: tag }
			});
		assert.ok(typeof body.ingredient === "object");
		data.ingredients = [];
		for (let i = 0; i < body.ingredient.length; ++i) {
			const ingredient = {
				name: body.ingredient[i],
				amount: body.amount[i],
				unit: body.unit[i]
			};
			data.ingredients.push(ingredient);
		}
		assert.ok(typeof body.step === "object");
		data.steps = [];
		for (let i = 0; i < body.step.length; ++i) {
			const step = {
				type: body.step_type[i],
				content: body.step[i]
			};
			data.steps.push(step);
		}
		data.cookingTime = body.cookingTime;
		data.servings = body.servings;
		data.type = body.type;
		data.delete_image = body.delete_image;

		req.body = data;
		return next();
	} catch(error) {
		return res.status(400).json({ error: "Coud not parse the request: " + error });
	}
}

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
router.post('/:id', parseRecipeId, upload.single('image'), transFormRequestBody, JSONValidations, validate, function (req, res, next) {
	req.body.image = req.file?.filename;
	req.body.id = res.recipeId;
	const recipe = Recipe.fromJSONData(req.body,
		res.recipeId,
		req.file?.filename);

	const deleteImage = req.body.delete_image;
	recipe.update(deleteImage);

	res.redirect(`/recipe/${recipe.id}?edited`);
});

/* POST Recipe (new) */
router.post('/', upload.single('image'), transFormRequestBody, JSONValidations, validate, function (req, res, next) {
	const recipe = Recipe.fromJSONData(req.body, undefined, req.file?.filename);
	const id = recipe.insert();

	res.redirect(`/recipe/${id}?new`);
});

/* DELETE Recipe */
router.delete('/:id', parseRecipeId, function (req, res, next) {
	Recipe.deleteById(res.recipeId);
	res.status(200).json({ id: res.recipeId, msg: "delete ok" });
});

module.exports = router;
