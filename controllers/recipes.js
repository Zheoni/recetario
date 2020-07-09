const { getDB } = require("../db");
const fs = require("fs");

function transformIntoRecipeObject(row) {
	row.method = row.method.split('\n');
	return row;
}

function getAllRecipes() {
	const db = getDB();

	const stmt = db.prepare("SELECT * FROM RECIPES");

	const recipes = stmt.all().map(transformIntoRecipeObject);

	return recipes;
}

function getById(id) {
	const db = getDB();

	const row = db.prepare("SELECT * FROM RECIPES WHERE id = ?").get(id);

	if (row) {
		const recipe = transformIntoRecipeObject(row);
		return recipe;
	} else {
		throw ("No recipe with id " + id);
	}
}

function getByIdWithIngredients(id) {
	const db = getDB();

	let recipe = getById(id);
	const ingredients = db.prepare(
		`SELECT amount, unit, name FROM RECIPE_INGREDIENTS ri
		JOIN INGREDIENTS i ON ri.ingredient = i.id
		WHERE ri.recipe = ?
		ORDER BY ri.sort ASC`
	).all(id);

	recipe.ingredients = ingredients;

	return recipe;
}

function create(recipe, imageName) {
	const db = getDB();

	const i_recipe = db.prepare("INSERT INTO RECIPES (name,author,description,method,image,type) VALUES ($name,$author,$desc,$method,$img,$type)");
	const i_ingredient = db.prepare("INSERT OR IGNORE INTO INGREDIENTS (name) VALUES (?)");
	const s_ingredient_id = db.prepare("SELECT id FROM INGREDIENTS WHERE name = ?");
	const i_recipe_ingredient = db.prepare("INSERT INTO RECIPE_INGREDIENTS (recipe, ingredient, amount, unit, sort) VALUES ($recipe, $ingredient, $amount, $unit, $sort)");

	function addIngredient(ingredient, amount, unit, sort, recipe_id) {
		i_ingredient.run(ingredient);
		const ingredient_id = s_ingredient_id.get(ingredient).id;
		i_recipe_ingredient.run({
			recipe: recipe_id,
			ingredient: ingredient_id,
			amount: amount,
			unit: unit,
			sort: sort
		});
	}

	if (!imageName) {
		imageName = "noimage.jpeg";
	}

	if (recipe.recipe_author.length <= 0) {
		recipe.recipe_author = null;
	}

	const info = i_recipe.run({
		name: recipe.recipe_name,
		author: recipe.recipe_author,
		desc: recipe.recipe_description,
		method: recipe.recipe_method,
		img: imageName,
		type: Number(recipe.recipe_type)
	});

	const recipe_id = info.lastInsertRowid;

	if (typeof recipe.ingredient === "string") {
		addIngredient(recipe.ingredient, recipe.amount, recipe.unit, 1, recipe_id);
	} else {
		for (let i = 0; i < recipe.ingredient.length; ++i) {
			addIngredient(recipe.ingredient[i], recipe.amount[i], recipe.unit[i], i, recipe_id);
		}
	}

	return recipe_id;
}

function deleteById(id) {
	const db = getDB();

	const image = db.prepare("SELECT image FROM RECIPES WHERE id = ?").get(id);
	if (image && image.image !== "noimage.jpeg") {
		const path = "./public/recipes/images/" + image.image;
		fs.unlink(path, (err) => {
			if (err)
				console.error(`Could not delete image for recipe ${id}, path was: \n\t"${path}".`)
			else
				console.log(`File: "${path}" was deleted.`);
		});
	}

	db.prepare("DELETE FROM RECIPES WHERE id = ?").run(id);

	console.log("Deleted recipe " + id);
}

module.exports = {
	getAllRecipes,
	getById,
	getByIdWithIngredients,
	create,
	deleteById
}
