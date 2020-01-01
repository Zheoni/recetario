function transformIntoRecipeObject(row) {
	row.ingredients = JSON.parse(row.ingredients);
	row.method = row.method.split('\n');
	return row;
}

function getAll(db) {
	return new Promise((resolve, reject) => {

		let recipes = [];

		db.all("SELECT * FROM RECIPES", (err, rows) => {
			if (err) {
				return reject(err);
			}
	
			rows.forEach(row => {
				const recipe = transformIntoRecipeObject(row);
				recipes.push(recipe);
			});

			resolve(recipes);
		});
	})
}

function getById(db, id) {
	try {
		if (typeof id !== "number") throw "Id is not a number.";

		return new Promise((resolve, reject) => {
			db.get("SELECT * FROM RECIPES WHERE ID=$id", {
				$id: id
			}, (err, row) => {
				if (err) {
					return reject(err);
				}
				if (row == undefined) {
					return reject("No recipe with id " + id);
				}
				const recipe = transformIntoRecipeObject(row);
				resolve(recipe);
			});
		});
	} catch (err) {
		console.error(err)
		return null;
	}
}

function create(db, recipe, imageName) {
	let ingredients = [];

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

	if (!imageName) {
		imageName = "noimage.jpeg";
	}

	return new Promise((resolve, reject) =>  {
		db.run("INSERT INTO RECIPES (NAME,AUTHOR,DESCRIPTION,INGREDIENTS,METHOD,IMAGE) VALUES ($name,$author,$desc,$ing,$method,$img)", {
			$name: recipe.name,
			$author: recipe.author,
			$desc: recipe.description,
			$ing: JSON.stringify(ingredients),
			$method: recipe.method,
			$img: imageName
		}, function(err) {
			if (err) {
				return reject(err);
			}
			resolve(this.lastID);
		});
	});
}

function deleteById(id) {

}

module.exports = { getAll, getById, create, deleteById }