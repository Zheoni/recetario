const q = require("../utils/queryLoader.js").getQueries();

class Step {
  /**
   * @type {{name: string}}
   */
  static stepTypes = q["sStepTypes"].all();

  /**
   * 
   * @param {Object} data Data of the step
   * @param {number} data.recipe ID of the recipe
   * @param {string|number} data.type Step type, one of Step.stepTypes by value or index.
   * @param {string} data.content Step content.
   */
  constructor(data) {
    this.recipe = data.recipe;
    this.type = typeof data.type === "number"
      ? data.type
      : Step.stepTypes.map(type => type.name).indexOf(data.type);
	  this.content = data.content;
  }

  /**
   * Loads the steps of a recipe.
   * @param {number} recipeId ID of the recipe
   * @returns {Step[]} Steps
   */
  static loadSteps(recipeId) {
    return q["sRecipeSteps"]
      .all(recipeId)
      .map(row => new Step(row));
  }

  insert(sort = null) {
    q["iStep"].run({
			recipe: this.recipe,
			type: this.type,
			content: this.content,
			sort: sort
		});
  }

  static insertMany(steps, recipeId = undefined) {
    for (let i = 0; i < steps.length; ++i) {
      if (recipeId !== undefined) steps[i].recipe = recipeId;
      steps[i].insert(i);
    }
  }

  static deleteFromRecipe(recipeId) {
    q["dRecipeSteps"].run(recipeId);
  }
}

module.exports = { Step };
