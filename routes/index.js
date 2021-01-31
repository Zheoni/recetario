const express = require('express');
const router = express.Router();

const { Recipe } = require("../models/recipe.model.js");
const { Step } = require("../models/step.model.js");
const { availableLocales } = require("../utils/localeLoader.js");
const { bundleLocales } = require("../utils/utils.js");

/* GET home page. */
router.get('/', function (req, res) {
	const allRecipes = Recipe.getAll();

	res.render('index', {
		recipes: allRecipes
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
