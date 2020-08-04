const { Recipe } = require("../models/recipe.model.js");
const { getDB } = require("../db");
const { getQueries } = require("../queryLoader.js");
const fs = require("fs");
const assert = require("assert");

const db = getDB();
const q = getQueries();

function checkIfExists(id) {
	return q["sExistRecipe"].pluck().get(id) === 1;
}

function deleteUnusedIngredients() {
	q["dUnusedIngredients"].run();
}

function deleteUnusedTags() {
	q["dUnusedTags"].run();
}

function insertIngredients(recipe) {
	for (let i = 0; i < recipe.ingredients.length; ++i) {
		const ingredient = recipe.ingredients[i];

		q["iIngredient"].run(ingredient.name);
		q["iRecipeIngredient"].run({
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
		q["iTag"].run(tag);
		q["iRecipeTag"].run({ recipe_id: recipe.id, tag: tag });
	}
}

function insertSteps(recipe) {
	for (let i = 0; i < recipe.steps.length; ++i) {
		const step = recipe.steps[i];
		q["iStep"].run({
			recipe: recipe.id,
			type: step.type,
			content: step.content,
			sort: i
		});
	}
}

function loadTags(recipe_id) {
	return q["sRecipeTags"].pluck().all(recipe_id);
}

function loadIngredients(recipe_id) {
	return q["sRecipeIngredients"].all(recipe_id);
}

function loadSteps(recipe_id) {
	return q["sRecipeSteps"].all(recipe_id);
}

function getAll() {
	const recipes = q["sAllRecipes"]
		.all()
		.map(row => new Recipe(row));

	return recipes;
}

function getById(id, options = {}) {
	const row = q["sRecipe"].get(id);
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
	const info = q["iRecipe"].run({
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
		q["uRecipeNoImage"].run(update_object);
	} else if (recipe.image && !deleteImage) {
		// If image changes
		update_object.image = recipe.image;
		q["uRecipeWithImage"].run(update_object);
	} else if (!recipe.image && deleteImage) {
		// If image is deleted
		update_object.image = null;
		q["uRecipeWithImage"].run(update_object);
	} else {
		throw new Error("Invalid input, cannot decide if image needs to be updated or deleted.");
	}

	// Delete all relations to the ingredients, add the received ones and
	// remove the ingredients that are not used by any recipe.
	const update_ingredients = db.transaction((recipe) => {
		q["dRecipeIngredients"].run(recipe.id);
		insertIngredients(recipe);
		deleteUnusedIngredients();
	});
	update_ingredients(recipe);

	// Do the same with tags
	const update_tags = db.transaction((recipe) => {
		q["dRecipeTags"].run(recipe.id);
		insertTags(recipe);
		deleteUnusedTags();
	});
	update_tags(recipe);

	// And for steps
	const update_steps = db.transaction((recipe) => {
		q["dRecipeSteps"].run(recipe.id);
		insertSteps(recipe);
	});
	update_steps(recipe);
}

function deleteById(id, imageName = undefined) {
	// Delete the image
	imageName = imageName || q["sRecipeImage"].pluck().get(id)

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
	q["dRecipe"].run(id);

	// Remove unused ingredients
	deleteUnusedIngredients();
	deleteUnusedTags();

	console.log("Deleted recipe " + id);
}

function searchByName(str, includeTags = false, limit = 50) {
	
	const results = q.search["sRecipeByName"].all({
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

	const results = q.search["sIngredientByName"].pluck().all({
		name: `%${str}%`,
		limit: limit
	});

	return results;
}

function searchTagByName(str, limit = 25) {

	const results = q.search["sTagByName"].pluck().all({
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
