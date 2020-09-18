const q = require("../utils/queryLoader.js").getQueries();

class Tag {
  constructor(data) {
    this.name = data.name;
    this.recipe = data.recipe;
  }

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
      if (!tag.recipe) tag.recipe = recipeId;
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
