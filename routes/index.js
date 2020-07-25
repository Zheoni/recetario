const express = require('express');
const router = express.Router();

const { getAll, searchByName } = require("../controllers/recipes.controller.js");

/* GET home page. */
router.get('/', async function (req, res, next) {
	const allRecipes = await getAll();

	res.render('index', { title: 'Recetario', recipes: allRecipes });
});

router.get('/about', function (req, res, next) {
	res.render('about', { title: 'Recetario - acerca de' });
});

router.get('/create', function (req, res, next) {
	res.render('create', { title: 'Recetario - nueva receta' });
});

router.get('/search', function (req, res, next) {
	let results = null;
	if (req.query.name) {
		results = searchByName(req.query.name, true);
	}

	res.render('search', { title: 'Recetario - busqueda', results: results });
});
module.exports = router;
