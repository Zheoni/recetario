const q = require("../utils/queryLoader.js").getQueries();

class Ingredient {
  constructor(data) {
    this.recipe = data.recipe;
    this.name = data.name;
    this.amount = data.amount;
    this.unit = data.unit;
  }

  static loadIngredients(recipeId) {
    return q["sRecipeIngredients"]
      .all(recipeId)
      .map(row => new Ingredient(row));
  }

  static deleteUnusedIngredients() {
    q["dUnusedIngredients"].run();
  }

  insert(sort = null) {
    q["iIngredient"].run(this.name);
    q["iRecipeIngredient"].run({
			recipe: this.recipe,
			ingredient: this.name,
			amount: this.amount,
			unit: this.unit,
			sort: sort
		});
  }

  static insertMany(ingredients, recipeId = undefined) {
    for (let i = 0; i < ingredients.length; ++i) {
      if (!ingredients[i].recipe) ingredients[i].recipe = recipeId;
      ingredients[i].insert(i);
    }
  }

  static deleteFromRecipe(recipeId) {
    q["dRecipeIngredients"].run(recipeId);
  }

  static searchByName(str, limit = 25) {
    const results = q.search["sIngredientByName"].pluck().all({
      name: `%${str}%`,
      limit: limit
    });
  
    return results;
  }
}

module.exports = { Ingredient };
