const { getDB } = require("../db");

function transformIntoRecipeObject(row) {
	row.ingredients = JSON.parse(row.ingredients);
	row.method = row.method.split('\n');
	return row;
}

function getAll() {
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

function create(recipe, imageName) {
	const db = getDB();

	const stmt = db.prepare("INSERT INTO RECIPES (name,author,description,ingredients,method,image) VALUES ($name,$author,$desc,$ing,$method,$img)");

	let ingredients = [];

	if (typeof recipe.ingredientName === "string") {
		ingredients.push({
			amount: recipe.ingredientQuantity,
			unit: recipe.ingredientUnit,
			name: recipe.ingredientName
		});
	} else {
		for (let i = 0; i < recipe.ingredientName.length; ++i) {
			const ingredient = {
				amount: recipe.ingredientQuantity[i],
				unit: recipe.ingredientUnit[i],
				name: recipe.ingredientName[i]
			}
	
			if (ingredient.name.length != 0) {
				ingredients.push(ingredient);
			}
		}
	}


	if (!imageName) {
		imageName = "noimage.jpeg";
	}

	const info = stmt.run({
		name: recipe.name,
		author: recipe.author,
		desc: recipe.description,
		ing: JSON.stringify(ingredients),
		method: recipe.method,
		img: imageName
	});

	return info.lastInsertRowid;
}

function deleteById(id) {
	const db = getDB();

	db.prepare("DELETE FROM RECIPES WHERE id = ?").run(id);
	console.log("Deleted recipe " + id);
}

module.exports = { getAll, getById, create, deleteById }