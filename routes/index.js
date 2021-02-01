const express = require('express');
const router = express.Router();

const { Recipe } = require("../models/recipe.model.js");
const { Step } = require("../models/step.model.js");
const { availableLocales } = require("../utils/localeLoader.js");
const { bundleLocales, validate } = require("../utils/utils.js");
const { query } = require('express-validator');

/* GET home page. */
router.get('/', [
	query("p").default(1).isInt({ min: 1 }).toInt()
], validate, function (req, res) {
	let page = req.query.p ?? 1;
	const limit = 18; // ? Maybe editable in the future
	
	const recipeCount = Recipe.getCount();
	const pageCount = Math.ceil(recipeCount / limit);
	if (page > pageCount) {
		page = pageCount;
	}
	const offset = page * limit - limit;

	const allRecipes = Recipe.getAll({ limit, offset });

	res.render('index', {
		recipes: allRecipes,
		page,
    pageCount
	});
});

router.get('/about', function (req, res) {
	res.render('about');
});

router.get('/create', bundleLocales([
	"alerts.reviewRecipeForm"
]), function (req, res) {
	res.render('create', {
		recipeTypes: Recipe.recipeTypes,
		stepTypes: Step.stepTypes
	});
});

router.get('/search', bundleLocales([
	"alerts.noRecipeFound",
	"alerts.cannotSearch",
	"alerts.invalidSearch"
]), function (req, res) {
	res.render('search', {
		recipeTypes: Recipe.recipeTypes
	});
});

router.get('/settings', bundleLocales([
	"alerts.deletedCaches",
	"alerts.deletedSettings"
]), function (req, res) {
	res.render('settings', {
		allLocales: availableLocales()
	});
});

module.exports = router;
