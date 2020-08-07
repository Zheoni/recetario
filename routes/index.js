const express = require('express');
const router = express.Router();

const { Recipe } = require("../models/recipe.model.js");
const { Step } = require("../models/step.model.js");

/* GET home page. */
router.get('/', function (req, res, next) {
	const allRecipes = Recipe.getAll();

	res.render('index', {
		title: 'Recetario',
		recipes: allRecipes,
		locale: res.locals.locale
	});
});

router.get('/about', function (req, res, next) {
	res.render('about', { title: 'Recetario - acerca de' });
});

router.get('/create', function (req, res, next) {
	res.render('create', {
		title: 'Recetario - nueva receta',
		recipeTypes: Recipe.recipeTypes,
		stepTypes: Step.stepTypes,
		locale: res.locals.locale
	});
});

router.get('/search', function (req, res, next) {
	let results = null;
	if (req.query.name) {
		results = Recipe.searchByName(req.query.name, {
			includeTags: true
		});
	}

	res.render('search', {
		title: 'Recetario - busqueda',
		results: results,
		locale: res.locals.locale
	});
});
module.exports = router;
