var express = require('express');
var router = express.Router();

const multer = require('multer');
const upload = multer({ dest: 'public/recipes/images' });

const controller = require("../controllers/recipes.js");

/* GET Recipe */
router.get('/:id', function(req, res, next) {
  try {
		const recipe = controller.getByIdWithIngredients(Number(req.params.id));
		const tags = controller.generateTags(recipe, "es")
		res.render('recipe', {
			title: recipe.name	|| "Receta",
			recipe: recipe,
			tags: tags
		});
	} catch (err) {
		res.status(404).render('error', { message: "Receta no encontrada", error: err })
	}
});

/* GET Recipe edit form */
router.get('/:id/edit', function (req, res, next) {
	const id = Number(req.params.id);
	const recipe = controller.getByIdWithIngredients(id);

	res.render('edit', { title: `Editar - ${recipe.name}`, recipe: recipe});
});

/* POST Recipe (edit) */ // Wanted to use PUT... but this is easier
router.post('/:id', upload.single('recipe_image'), function (req, res, next) {
	const id = Number(req.params.id);

	if (req.file) {
		controller.update(id, req.body, req.file.filename);
	} else {
		controller.update(id, req.body);
	}

	res.redirect('/recipe/' + id);
});

/* POST Recipe (new) */ 
router.post('/', upload.single('recipe_image'), function (req, res, next) {
	let id;
	if (req.file) {
		id = controller.create(req.body, req.file.filename);
	} else {
		id = controller.create(req.body);
	}
	res.redirect('/recipe/' + id);
});

/* DELETE Recipe */
router.delete('/:id', async function (req, res, next) {
	let id = Number(req.params.id);
	if (id) {
		controller.deleteById(id);
		
		res.status(200).send({ id: id, msg: "delete ok"});
	} else {
		res.sendStatus(400);
	}
});

module.exports = router;
