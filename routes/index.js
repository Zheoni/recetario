const express = require('express');
const router = express.Router();

const multer = require('multer');
const upload = multer({ dest: 'public/recipes/images' });

const recipes = require("../controllers/recipes.js");

/* GET home page. */
router.get('/', async function(req, res, next) {
	const allRecipes =  await recipes.getAll(req.app.database);

	res.render('index', { title: 'Recetario', recipes: allRecipes });
});

/* GET id */
router.get('/recipe/:id', async function(req, res, next) {
	try {
		const recipe = await recipes.getById(req.app.database, Number(req.params.id));
		
		res.render('recipe', { title: 'Recetario - ' + recipe.NAME, recipe: recipe });
	} catch(err) {
		res.status(404).render('error', { message: "Recipe not found", error: err })
	}

});

router.get('/about', function(req, res, next) {
	res.render('about', { title: 'Recetario - about' });
});

router.get('/create', function(req, res, next) {
	res.render('create', { title: 'Recetario - new recipe' });
});

router.post('/create', upload.single('img'), async function(req, res, next) {
	let id;
	if (req.file) {
		id = await recipes.create(req.app.database, req.body, req.file.filename);
	} else {
		id = await recipes.create(req.app.database, req.body);
	}
	res.redirect('/recipe/' + String(id));
});

module.exports = router;
