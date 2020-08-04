var express = require('express');
var router = express.Router();

const multer = require('multer');
const upload = multer({ dest: 'public/recipes/images' });
const { validationResult } = require("express-validator")

const controller = require("../controllers/recipes.controller.js");
const { Recipe, recipeValidations } = require('../models/recipe.model.js');

function validate(validations) {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    res.status(400).json({ errors: errors.array() });
  };
};

/* GET Recipe */
router.get('/:id', function(req, res, next) {
	const id = Number(req.params.id);

	if (!controller.checkIfExists(id)) {
		res.status(404).render('error', { message: "Receta no encontrada", error: {} });
	}

	const recipe = controller.getById(id, { all: true });

	let alerts = [];

	if (req.query.hasOwnProperty("new")) {
		alerts.push({
			content: "Receta creada correctamente.",
			type: "success",
			delay: 10000,
			candismiss: true
		})
	}

	if (req.query.hasOwnProperty("edited")) {
		alerts.push({
			content: "Receta editada correctamente.",
			type: "success",
			delay: 10000,
			candismiss: true
		})
	}
	res.render('recipe', {
		title: recipe.name	|| "Receta",
		recipe: recipe.formatted(),
		alerts: alerts
	});
});

/* GET Recipe edit form */
router.get('/:id/edit', function (req, res, next) {
	const id = Number(req.params.id);

	if (!controller.checkIfExists(id)) {
		res.status(404).render('error', { message: "Receta no encontrada", error: {} });
	}

	const recipe = controller.getById(id, { all: true });

	res.render('edit', { title: `Editar - ${recipe.name}`, recipe: recipe.formatted()});
});

/* POST Recipe (edit) */ // Wanted to use PUT... but this is easier
router.post('/:id', upload.single('recipe_image'), validate(recipeValidations), function (req, res, next) {
	const id = Number(req.params.id);

	const recipe = Recipe.fromFormInput(req.body,
		id,
		req.file && req.file.filename);

	const deleteImage = req.body.recipe_delete_image === "true";

	controller.update(recipe, deleteImage);

	res.redirect(`/recipe/${id}?edited`);
});

/* POST Recipe (new) */ 
router.post('/', upload.single('recipe_image'), validate(recipeValidations),function (req, res, next) {
	let recipe = Recipe.fromFormInput(req.body,
		undefined,
		req.file && req.file.filename);

	const id = controller.create(recipe);
	
	res.redirect(`/recipe/${id}?new`);
});

/* DELETE Recipe */
router.delete('/:id', async function (req, res, next) {
	const id = Number(req.params.id);

	if (!controller.checkIfExists(id)) {
		res.status(404).render('error', { message: "Receta no encontrada", error: {} });
	}

	if (id) {
		controller.deleteById(id);
		
		res.status(200).send({ id: id, msg: "delete ok"});
	} else {
		res.sendStatus(400);
	}
});

module.exports = router;
