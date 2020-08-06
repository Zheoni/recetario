const express = require('express');
const router = express.Router();

const { Recipe } = require("../models/recipe.model.js");
const { Step } = require("../models/step.model.js");

/* GET home page. */
router.get('/', function (req, res, next) {
	const allRecipes = Recipe.getAll();

	res.render('index', { title: 'Recetario', recipes: allRecipes });
});

router.get('/about', function (req, res, next) {
	res.render('about', { title: 'Recetario - acerca de' });
});

router.get('/create', function (req, res, next) {
	res.render('create', {
		title: 'Recetario - nueva receta',
		recipeTypes: Recipe.recipeTypes,
		stepTypes: Step.stepTypes,
		localisation: res.localisation
	});
});

router.get('/search', function (req, res, next) {
	let results = null;
	if (req.query.name) {
		results = Recipe.searchByName(req.query.name, {
			includeTags: true
		});
	}

	res.render('search', { title: 'Recetario - busqueda', results: results });
});
module.exports = router;
