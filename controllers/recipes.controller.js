const { Recipe } = require("../models/recipe.model.js");
const { getDB } = require("../db");
const fs = require("fs");
const assert = require("assert");

const db = getDB();

const s_exist = db.prepare("SELECT 1 FROM RECIPES WHERE id = ?");

const s_recipes_all = db.prepare("SELECT * FROM RECIPES");

const s_recipe_id = db.prepare("SELECT * FROM RECIPES WHERE id = ?");

const s_ingredients_id = db.prepare(
	`SELECT amount, unit, name FROM RECIPE_INGREDIENTS ri
	JOIN INGREDIENTS i ON ri.ingredient = i.id
	WHERE ri.recipe = ?
	ORDER BY ri.sort ASC`);

const s_tags_id = db.prepare(
	`SELECT name FROM RECIPE_TAGS rt
	JOIN TAGS t ON t.id = rt.tag
	WHERE rt.recipe = ?
	ORDER BY name ASC`);

const s_steps_id = db.prepare(
	`SELECT id, type, content FROM STEPS
	WHERE recipe = ?
	ORDER BY sort ASC`);

const s_recipe_image = db.prepare("SELECT image FROM RECIPES WHERE id = ?");

const i_recipe = db.prepare("INSERT INTO RECIPES (name,author,description,image,type) VALUES ($name,$author,$desc,$img,$type)");

const u_recipe = db.prepare(`UPDATE RECIPES
	SET name = $name,
	author = $author,
	description = $description,
	type = $type
	WHERE id = $id`);

const u_recipe_with_image = db.prepare(`UPDATE RECIPES
	SET name = $name,
	author = $author,
	description = $description,
	image = $image,
	type = $type
	WHERE id = $id`);

const d_recipe = db.prepare("DELETE FROM RECIPES WHERE id = ?");

const d_unused_ingredients = db.prepare(
	`DELETE FROM INGREDIENTS
	WHERE (SELECT COUNT(*) FROM RECIPE_INGREDIENTS
	WHERE INGREDIENTS.id = RECIPE_INGREDIENTS.ingredient) = 0`);

const d_unused_tags = db.prepare(
	`DELETE FROM TAGS
	WHERE (SELECT COUNT(*) FROM RECIPE_TAGS
	WHERE TAGS.id = RECIPE_TAGS.tag) = 0`);

const i_ingredient = db.prepare("INSERT OR IGNORE INTO INGREDIENTS (name) VALUES (?)");
const i_recipe_ingredient = db.prepare("INSERT INTO RECIPE_INGREDIENTS (recipe, ingredient, amount, unit, sort) VALUES ($recipe, (SELECT id FROM INGREDIENTS WHERE name = $ingredient), $amount, $unit, $sort)");
const d_recipe_ingredients_id = db.prepare("DELETE FROM RECIPE_INGREDIENTS WHERE recipe = ?");

const i_tag = db.prepare("INSERT OR IGNORE INTO TAGS (name) VALUES (?)");
const i_recipe_tag = db.prepare("INSERT INTO RECIPE_TAGS (recipe, tag) VALUES ($recipe_id,(SELECT id FROM TAGS WHERE name = $tag))");
const d_recipe_tags_id = db.prepare("DELETE FROM RECIPE_TAGS WHERE recipe = ?");

const i_step = db.prepare("INSERT INTO STEPS (recipe,type,content,sort) VALUES ($recipe,$type,$content,$sort)");
const d_steps = db.prepare("DELETE FROM STEPS WHERE recipe = ?");


function checkIfExists(id) {
	return s_exist.pluck().get(id) === 1;
}

function deleteUnusedIngredients() {
	d_unused_ingredients.run();
}

function deleteUnusedTags() {
	d_unused_tags.run();
}

function insertIngredients(recipe) {
	for (let i = 0; i < recipe.ingredients.length; ++i) {
		const ingredient = recipe.ingredients[i];

		i_ingredient.run(ingredient.name);
		i_recipe_ingredient.run({
			recipe: recipe.id,
			ingredient: ingredient.name,
			amount: ingredient.amount,
			unit: ingredient.unit,
			sort: i
		});
	}
}

function insertTags(recipe) {
	for (let tag of recipe.tags) {
		i_tag.run(tag);
		i_recipe_tag.run({ recipe_id: recipe.id, tag: tag });
	}
}

function insertSteps(recipe) {
	for (let i = 0; i < recipe.steps.length; ++i) {
		const step = recipe.steps[i];
		i_step.run({
			recipe: recipe.id,
			type: step.type,
			content: step.content,
			sort: i
		});
	}
}

function loadTags(recipe_id) {
	return s_tags_id.pluck().all(recipe_id);
}

function loadIngredients(recipe_id) {
	return s_ingredients_id.all(recipe_id);
}

function loadSteps(recipe_id) {
	return s_steps_id.all(recipe_id);
}

function getAll() {
	const recipes = s_recipes_all.all()
		.map(row => new Recipe(row));

	return recipes;
}

function getById(id, options = {}) {
	const row = s_recipe_id.get(id);
	const recipe =  new Recipe(row);

	const defaults = {
		loadIngredients: false,
		loadTags: false,
		loadSteps: false,
		all: false
  };
	options = Object.assign({}, defaults, options);
	
	if (options.loadIngredients || options.all) {
		recipe.ingredients = loadIngredients(recipe.id);
	}
	if (options.loadTags || options.all) {
		recipe.tags = loadTags(recipe.id);
	}
	if (options.loadSteps || options.all) {
		recipe.steps = loadSteps(recipe.id);
	}

	return recipe;
}

function create(recipe) {
	const info = i_recipe.run({
		name: recipe.name,
		author: recipe.author,
		desc: recipe.description,
		img: recipe.image,
		type: recipe.type
	});

	recipe.id = info.lastInsertRowid;

	insertIngredients(recipe);
	insertTags(recipe);
	insertSteps(recipe);

	return recipe.id;
}

function update(recipe, deleteImage = false) {
	let update_object = {
		id: recipe.id,
		name: recipe.name,
		author: recipe.author,
		description: recipe.description,
		type: recipe.type
	};

	if (!recipe.image && !deleteImage) {
		// If image does not change
		u_recipe.run(update_object);
	} else if (recipe.image && !deleteImage) {
		// If image changes
		update_object.image = recipe.image;
		u_recipe_with_image.run(update_object);
	} else if (!recipe.image && deleteImage) {
		// If image is deleted
		update_object.image = null;
		u_recipe_with_image.run(update_object);
	} else {
		throw new Error("Invalid input, cannot decide if image needs to be updated or deleted.");
	}

	// Delete all relations to the ingredients, add the received ones and
	// remove the ingredients that are not used by any recipe.
	const update_ingredients = db.transaction((recipe) => {
		d_recipe_ingredients_id.run(recipe.id);
		insertIngredients(recipe);
		deleteUnusedIngredients();
	});
	update_ingredients(recipe);

	// Do the same with tags
	const update_tags = db.transaction((recipe) => {
		d_recipe_tags_id.run(recipe.id);
		insertTags(recipe);
		deleteUnusedTags();
	});
	update_tags(recipe);

	// And for steps
	const update_steps = db.transaction((recipe) => {
		d_steps.run(recipe.id);
		insertSteps(recipe);
	});
	update_steps(recipe);
}

function deleteById(id, imageName = undefined) {
	// Delete the image
	imageName = imageName || s_recipe_image.pluck().get(id)

	if (imageName && imageName !== "noimage.jpeg") {
		const path = "./public/recipes/images/" + imageName;
		fs.unlink(path, (err) => {
			if (err)
				console.error(`Could not delete image for recipe ${id}, path was: \n\t"${path}".`)
			else
				console.log(`File: "${path}" was deleted.`);
		});
	}

	// Delete the recipe
	d_recipe.run(id);

	// Remove unused ingredients
	deleteUnusedIngredients();
	deleteUnusedTags();

	console.log("Deleted recipe " + id);
}

function searchByName(str, includeTags = false, limit = 50) {
	
	const results = db.prepare("SELECT id, name FROM RECIPES WHERE name LIKE $name ORDER BY name ASC LIMIT $limit").all({
		name: `%${str}%`,
		limit: limit
	});

	if (includeTags) {
		for (let i = 0; i < results.length; ++i) {
			results[i].tags = loadTags(results[i].id);
		}
	}

	return results;
}

function searchIngredientByName(str, limit = 25) {

	const results = db.prepare("SELECT name FROM INGREDIENTS WHERE name LIKE $name ORDER BY name ASC LIMIT $limit").pluck().all({
		name: `%${str}%`,
		limit: limit
	});

	return results;
}

function searchTagByName(str, limit = 25) {

	const results = db.prepare("SELECT name FROM TAGS WHERE name LIKE $name ORDER BY name ASC LIMIT $limit").pluck().all({
		name: `%${str}%`,
		limit: limit
	});

	return results;
}

Recipe.prototype.loadIngredients = function () {
	this.ingredietns = loadIngredients(this.id);
}

Recipe.prototype.loadTags = function () {
	this.tags = loadTags(this.id);
};

Recipe.prototype.loadSteps = function () {
	this.steps = loadSteps(this.id);
}

Recipe.prototype.exists = function () {
	assert.ok(this.id, "The object has not a defined id");
	return checkIfExists(this.id);
}

Recipe.prototype.delete = function () {
	assert.ok(this.id, "The object has not a defined id");
	deleteById(this.id, this.image);
}

Recipe.prototype.save = function (deleteImage = false) {
	assert.ok(this.id, "The object has not a defined id");
	update(this, deleteImage);
}

module.exports = {
	getAll,
	getById,
	create,
	update,
	deleteById,
	checkIfExists,
	searchByName,
	searchIngredientByName,
	searchTagByName,
	Recipe
}
