const express = require('express');
const router = express.Router();

const multer = require('multer');
const upload = multer({ dest: 'public/recipes/images' });

const fs = require('fs');

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
		res.render('recipe', { title: recipe.name	|| "Receta", recipe: recipe });
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

router.post('/create', upload.single('recipe_image'), function (req, res, next) {
	let id;
	if (req.file) {
		id = recipes.create(req.body, req.file.filename);
	} else {
		id = recipes.create(req.body);
	}
	res.redirect('/recipe/' + String(id));
});

router.post('/recipe/:id/delete', async function (req, res, next) {
	let id = Number(req.params.id);
	if (id && req.body) {
		try {
			const {name, image} = (recipes.getById(id));
			if (name.toLowerCase() === req.body.userInput.toLowerCase()) {
				recipes.deleteById(id);

				if (image !== "noimage.jpeg") {
					const path = "public/recipes/images/" + image;
			
					fs.unlink(path, (err) => {
						if (err) throw err;
						console.log('File: "' + path + ' was deleted');
					});
				}

				res.send("delete ok");
			} else {
				throw "wrong input";
			}
		} catch (err) {
			res.send(err);
		}
	}
});

module.exports = router;
