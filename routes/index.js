const express = require('express');
const router = express.Router();

const multer = require('multer');
const upload = multer({ dest: 'public/recipes/images' });

const recipes = require("../controllers/recipes.js");

/* GET home page. */
router.get('/', async function (req, res, next) {
	const allRecipes = await recipes.getAllRecipes();

	res.render('index', { title: 'Recetario', recipes: allRecipes });
});

/* GET id */
router.get('/recipe/:id', function (req, res, next) {
	try {
		const recipe = recipes.getByIdWithIngredients(Number(req.params.id));
		const tags = recipes.generateTags(recipe, "es")
		res.render('recipe', {
			title: recipe.name	|| "Receta",
			recipe: recipe,
			tags: tags
		});
	} catch (err) {
		res.status(404).render('error', { message: "Receta no encontrada", error: err })
	}

});

router.get('/about', function (req, res, next) {
	res.render('about', { title: 'Recetario - acerca de' });
});

router.get('/create', function (req, res, next) {
	res.render('create', { title: 'Recetario - nueva receta' });
});

router.post('/recipe', upload.single('recipe_image'), function (req, res, next) {
	let id;
	if (req.file) {
		id = recipes.create(req.body, req.file.filename);
	} else {
		id = recipes.create(req.body);
	}
	res.redirect('/recipe/' + String(id));
});

router.put('/recipe/:id', upload.single('recipe_image'), function (req, res, next) {
	const id = Number(req.params.id);

	let recipe = recipes.getByIdWithIngredients(id);
	if (req.file) {

	}
})

router.delete('/recipe/:id', async function (req, res, next) {
	let id = Number(req.params.id);
	if (id) {
		recipes.deleteById(id);
		
		res.status(200).send({ id: id, msg: "delete ok"});
	} else {
		res.sendStatus(400);
	}
});

module.exports = router;
