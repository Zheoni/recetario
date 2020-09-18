const q = require("../utils/queryLoader.js").getQueries();

class Step {
  static stepTypes = q["sStepTypes"].all();

  constructor(data) {
    this.recipe = data.recipe;
    this.type = typeof data.type === "number"
      ? data.type
      : Step.stepTypes.map(type => type.name).indexOf(data.type);
	  this.content = data.content;
  }

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
      if (!steps[i].recipe) steps[i].recipe = recipeId;
      steps[i].insert(i);
    }
  }

  static deleteFromRecipe(recipeId) {
    q["dRecipeSteps"].run(recipeId);
  }
}

module.exports = { Step };
