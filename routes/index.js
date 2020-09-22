const express = require('express');
const router = express.Router();

const { Recipe } = require("../models/recipe.model.js");
const { Step } = require("../models/step.model.js");
const { availableLocales } = require("../utils/localeLoader.js");
const { bundleLocales, validate } = require("../utils/utils.js");
const { query } = require("express-validator");

/* GET home page. */
router.get('/', function (req, res, next) {
	const allRecipes = Recipe.getAll();

	res.render('index', {
		recipes: allRecipes
	});
});

router.get('/about', function (req, res, next) {
	res.render('about');
});

router.get('/create', bundleLocales([
	"alerts.reviewRecipeForm"
]), function (req, res, next) {
	res.render('create', {
		recipeTypes: Recipe.recipeTypes,
		stepTypes: Step.stepTypes
	});
});

router.get('/search', bundleLocales([
	"alerts.noRecipeFound"
]), [
	query("name").optional().isString()
], validate, function (req, res, next) {
	let results = null;
	if (req.query.name) {
		results = Recipe.searchByName(req.query.name, {
			includeTags: true
		});
	}

	res.render('search', {
		results: results
	});
});

router.get('/settings', bundleLocales([
	"alerts.deletedCaches",
	"alerts.deletedSettings"
]), function (req, res, next) {
	res.render('settings', {
		allLocales: availableLocales()
	});
});

module.exports = router;
