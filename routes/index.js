const express = require('express');
const router = express.Router();

const { Recipe } = require("../models/recipe.model.js");
const { Step } = require("../models/step.model.js");
const { availableLocales } = require("../localeLoader.js");
const { bundleLocales } = require("../utils.js");

/* GET home page. */
router.get('/', function (req, res, next) {
	const allRecipes = Recipe.getAll();

	res.render('index', {
		recipes: allRecipes,
		locale: res.locals.locale
	});
});

router.get('/about', function (req, res, next) {
	res.render('about', { title: 'Recetario - acerca de' });
});

router.get('/create', bundleLocales([
	"alerts.reviewRecipeForm"
]), function (req, res, next) {
	res.render('create', {
		recipeTypes: Recipe.recipeTypes,
		stepTypes: Step.stepTypes,
		locale: res.locals.locale
	});
});

router.get('/search', bundleLocales([
	"alerts.noRecipeFound"
]),function (req, res, next) {
	let results = null;
	if (req.query.name) {
		results = Recipe.searchByName(req.query.name, {
			includeTags: true
		});
	}

	res.render('search', {
		results: results,
		locale: res.locals.locale
	});
});

router.get('/settings', bundleLocales([
	"alerts.deletedCaches",
	"alerts.deletedSettings"
]), function (req, res, next) {
	res.render('settings', {
		locale: res.locals.locale,
		allLocales: availableLocales()
	});
});

module.exports = router;
