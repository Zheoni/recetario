var express = require('express');
var router = express.Router();

const multer = require('multer');
const upload = multer({ dest: 'public/recipes/images' });

const controller = require("../controllers/recipes.js");

/* GET Recipe */
router.get('/:id', function(req, res, next) {
  try {
		const recipe = controller.getByIdComplete(Number(req.params.id));
		controller.prepareTags(recipe, "es");

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
			recipe: recipe,
			alerts: alerts
		});
	} catch (err) {
		res.status(404).render('error', { message: "Receta no encontrada", error: err })
	}
});

/* GET Recipe edit form */
router.get('/:id/edit', function (req, res, next) {
	const id = Number(req.params.id);
	const recipe = controller.getByIdComplete(id);

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

	res.redirect(`/recipe/${id}?edited`);
});

/* POST Recipe (new) */ 
router.post('/', upload.single('recipe_image'), function (req, res, next) {
	let id;
	if (req.file) {
		id = controller.create(req.body, req.file.filename);
	} else {
		id = controller.create(req.body);
	}
	res.redirect(`/recipe/${id}?new`);
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
