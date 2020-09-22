const q = require("../utils/queryLoader.js").getQueries();

class Tag {

  /**
   * 
   * @param {Object} data Data of the tag
   * @param {string} data.name Tag name
   * @param {number} data.recipe ID of the recipe
   */
  constructor(data) {
    this.name = data.name;
    this.recipe = data.recipe;
  }

  /**
   * Load the tags for a recipe
   * @param {number} recipeId ID of the recipe
   * @returns {Tag[]} Tags
   */
  static loadTags(recipeId) {
    return q["sRecipeTags"]
      .all(recipeId)
      .map(row => new Tag(row));
  }

  static deleteUnusedTags() {
    q["dUnusedTags"].run();
  }

  insert() {
    q["iTag"].run(this.name);
    q["iRecipeTag"].run({ recipe_id: this.recipe, tag: this.name });
  }

  static insertMany(tags, recipeId = undefined) {
    for (const tag of tags) {
      if (recipeId !== undefined) tag.recipe = recipeId;
      tag.insert();
    }
  }

  static deleteFromRecipe(recipeId) {
    q["dRecipeTags"].run(recipeId);
  }

  static searchByName(str, limit = 25) {
    const results = q.search["sTagByName"].pluck().all({
      name: `%${str}%`,
      limit: limit
    });
  
    return results;
  }
}

module.exports = { Tag };
