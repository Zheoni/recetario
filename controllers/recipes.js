const { getDB } = require("../db");
const fs = require("fs");

const recipeTypes = ["none", "starter", "main", "dessert"];

function transformIntoRecipeObject(row) {
	row.method = row.method.split('\n');

	if (row.image == null) {
		row.image = "noimage.jpeg";
	}

	return row;
}

function validateRecipeInput(body) {
	if (body.recipe_name.length <= 0 || body.recipe_name.length > 128)
		return false;
	
	if (body.recipe_description.length <= 0 || body.recipe_description.length > 256)
		return false;

	const tags_regex = /^[0-9A-Za-zñáéíóúäëïöüàèìòùâêîôû\- ]+$/;

	if (!body.tags.split(",").every((tag) => tags_regex.test(tag)))
		return false;

	if (!body.ingredient.every((ingredient) => ingredient.length > 0))
		return false;

	if (!body.amount.every((amount) => {
		if (amount.length > 0) {
			return Number(amount) !== NaN;
		}
	}))
		return false;

	if (body.recipe_method.length <= 128)
		return false;

	if (!recipeTypes.includes(body.recipe_type))
		return false;

	return true;
}

function checkIfExists(id) {
	const db = getDB();
	return db.prepare("SELECT 1 FROM RECIPES WHERE id = ?").pluck().get(id) === 1;
}

function deleteUnusedIngredients() {
	const db = getDB();
	db.prepare(`DELETE FROM INGREDIENTS WHERE
		(SELECT COUNT(*) FROM RECIPE_INGREDIENTS WHERE INGREDIENTS.id = RECIPE_INGREDIENTS.ingredient) = 0`).run();
}

function deleteUnusedTags() {
	const db = getDB();
	db.prepare(`DELETE FROM TAGS WHERE
		(SELECT COUNT(*) FROM RECIPE_TAGS WHERE TAGS.id = RECIPE_TAGS.tag) = 0`).run();
}

function addIngredients(ingredients, amounts, units, recipe_id) {
	const db = getDB();

	const i_ingredient = db.prepare("INSERT OR IGNORE INTO INGREDIENTS (name) VALUES (?)");
	const i_recipe_ingredient = db.prepare("INSERT INTO RECIPE_INGREDIENTS (recipe, ingredient, amount, unit, sort) VALUES ($recipe, (SELECT id FROM INGREDIENTS WHERE name = $ingredient), $amount, $unit, $sort)");

	if (typeof ingredients === "string") {
		ingredients = [ingredients];
		amounts = [amounts];
		units = [units];
	}

	for (let i = 0; i < ingredients.length; ++i) {
		i_ingredient.run(ingredients[i]);
		i_recipe_ingredient.run({
			recipe: recipe_id,
			ingredient: ingredients[i],
			amount: amounts[i],
			unit: units[i],
			sort: i
		});
	}
}

function addTags(tags, recipe_id) {
	const db = getDB();

	const i_tag = db.prepare("INSERT OR IGNORE INTO TAGS (name) VALUES (?)");

	const i_recipe_tag = db.prepare(`INSERT INTO RECIPE_TAGS (recipe, tag) VALUES
	($recipe_id,(SELECT id FROM TAGS WHERE name = $tag))`);

	for (let tag of tags) {
		console.log(tag)
		i_tag.run(tag);
		i_recipe_tag.run({recipe_id, tag});
	}
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

function getByIdComplete(id) {
	const db = getDB();

	let recipe = getById(id);
	const ingredients = db.prepare(
		`SELECT amount, unit, name FROM RECIPE_INGREDIENTS ri
		JOIN INGREDIENTS i ON ri.ingredient = i.id
		WHERE ri.recipe = ?
		ORDER BY ri.sort ASC`).all(id);

	const tags = db.prepare(
		`SELECT name FROM RECIPE_TAGS rt
		JOIN TAGS t ON t.id = rt.tag
		WHERE rt.recipe = ?
		ORDER BY name ASC`).all(id);

	recipe.ingredients = ingredients;
	recipe.tags = tags;

	return recipe;
}

function create(recipe, imageName) {
	if (!validateRecipeInput(recipe))
		throw new Error("Recipe input invalid");

	const db = getDB();

	const i_recipe = db.prepare("INSERT INTO RECIPES (name,author,description,method,image,type) VALUES ($name,$author,$desc,$method,$img,$type)");

	if (recipe.recipe_author.length <= 0) {
		recipe.recipe_author = null;
	}

	const type_number = recipeTypes.indexOf(recipe.recipe_type);

	if (type_number < 0) type_number = 0;

	const info = i_recipe.run({
		name: recipe.recipe_name,
		author: recipe.recipe_author,
		desc: recipe.recipe_description,
		method: recipe.recipe_method,
		img: imageName,
		type: type_number
	});

	const recipe_id = info.lastInsertRowid;

	addIngredients(recipe.ingredient, recipe.amount, recipe.unit, recipe_id);
	addTags(recipe.tags.split(","), recipe_id);

	return recipe_id;
}

function update(id, recipe, imageName) {
	if (!validateRecipeInput(recipe))
		throw new Error("Recipe input invalid");

	const db = getDB();

	const u_recipe = db.prepare(`UPDATE RECIPES
	SET name = $name,
	author = $author,
	description = $description,
	method = $method,
	type = $type
	WHERE id = $id`);

	const u_recipe_with_image = db.prepare(`UPDATE RECIPES
	SET name = $name,
	author = $author,
	description = $description,
	method = $method,
	image = $image,
	type = $type
	WHERE id = $id`);

	let update_object = {
		id: id,
		name: recipe.recipe_name,
		author: recipe.recipe_author,
		description: recipe.recipe_description,
		method: recipe.recipe_method,
		type: recipeTypes.indexOf(recipe.recipe_type)
	};

	if (!imageName && recipe.recipe_delete_image === "false") {
		// If image does not change
		u_recipe.run(update_object);
	} else if (imageName) {
		// If image changes
		update_object.image = imageName;
		u_recipe_with_image.run(update_object);
	} else {
		// If image is deleted
		update_object.image = null;
		u_recipe_with_image.run(update_object);
	}

	// Delete all relations to the ingredients, add the received ones and
	// remove the ingredients that are not used by any recipe.
	const update_ingredients = db.transaction((ingredients, amounts, units, id) => {
		db.prepare("DELETE FROM RECIPE_INGREDIENTS WHERE recipe = ?").run(id);
		addIngredients(ingredients, amounts, units, id);
		deleteUnusedIngredients();
	});
	update_ingredients(recipe.ingredient, recipe.amount, recipe.unit, id);

	// Do the same with tags
	const update_tags = db.transaction((tags, id) => {
		db.prepare("DELETE FROM RECIPE_TAGS WHERE recipe = ?").run(id);
		addTags(tags, id);
		deleteUnusedTags();
	});
	update_tags(recipe.tags.split(","), id);
	
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

	deleteUnusedIngredients();

	console.log("Deleted recipe " + id);
}

function typeTag(type, language) {
	const classes = ["type-tag"];
	let content;
	if (type > 0 && type < 4) {
		let types;
		if (language === "en") {
			types = ["starter dish", "main dish", "dessert"]
		} else if (language === "es") {
			types = ["entrante", "plato principal", "postre"]
		}

		content = types[type - 1];
		classes.push("recipe-" + recipeTypes[type])
	} else {
		content = null;
	}
	return newTag(content, classes);
}

function newTag(content, classes = []) {
	return { content, classes };
}

function prepareTags(recipe, language = "en") {
	let tags = [];
	if (recipe.type) {
		tags.push(typeTag(recipe.type, language));
	}

	for (const tag of recipe.tags) {
		tags.push(newTag(tag.name, ["user-tag"]));
	}

	recipe.tags = tags;

	return tags;
}

module.exports = {
	getAllRecipes,
	getById,
	getByIdComplete,
	create,
	update,
	deleteById,
	prepareTags,
	checkIfExists
}
