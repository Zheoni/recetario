const express = require('express');
const router = express.Router();

const { getAllRecipes } = require("../controllers/recipes.js");

/* GET home page. */
router.get('/', async function (req, res, next) {
	const allRecipes = await getAllRecipes();

	res.render('index', { title: 'Recetario', recipes: allRecipes });
});

router.get('/about', function (req, res, next) {
	res.render('about', { title: 'Recetario - acerca de' });
});

router.get('/create', function (req, res, next) {
	res.render('create', { title: 'Recetario - nueva receta' });
});


module.exports = router;
