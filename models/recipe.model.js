class Recipe {
  static recipeTypes = ["none", "starter", "main", "dessert"];
  static baseImagePath = "/recipes/images/";

  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.author = data.author;
    this.description = data.description;
    this.method = data.method;
    this.image = data.image;
    this.type = data.type;
    this.CREATED_AT = data.CREATED_AT;
    this.UPDATED_AT = data.UPDATED_AT;

    this.ingredients = data.ingredients;
    this.tags = data.tags;
  }

  get methodSteps() {
    return this.method.split("\n");
  }

  get imageURL() {
    return Recipe.baseImagePath + (this.image || "noimage.jpeg");
  }

  static fromFormInput(body, id = undefined, imageName = undefined) {
    if (typeof body.ingredient === "string") {
      body.ingredient = [body.ingredient];
      body.amount = [body.amount];
      body.unit = [body.unit];
    }

    if (!validateInput(body)) {
      throw new Error("Invalid form input");
    }

    if (body.recipe_author.length <= 0) {
      body.recipe_author = null;
    }

    const type_number = Recipe.recipeTypes.indexOf(body.recipe_type);
    if (type_number < 0) type_number = 0;

    let recipe = new Recipe({
      id: id,
      name: body.recipe_name,
      author: body.recipe_author,
      description: body.recipe_description,
      method: body.recipe_method,
      image: imageName,
      type: type_number,
      CREATED_AT: undefined,
      UPDATED_AT: undefined
    });

    recipe.ingredients = body.ingredient.map((igr, i) => {
      return { name: igr, amount: body.amount[i], unit: body.unit[i] };
    });

    recipe.tags = body.tags.toLowerCase().split(",");

    console.log(recipe);

    return recipe;
  }

  get typeString() {
    return Recipe.recipeTypes[this.type];
  }

  set typeString(str) {
    this.type = Recipe.stringToTypeNumber(str);
  }

  static stringToTypeNumber(str) {
    if (Recipe.recipeTypes.includes(str)) {
      return Recipe.recipeTypes.indexOf(str);
    } else {
      throw new Error(`Recipe type "${str}" is not a valid type.`);
    }
  }

  formattedTags(language = "es") {
    let tags = [];
    if (this.type !== 0) {
      let types;
      if (language === "en") {
        types = ["starter dish", "main dish", "dessert"]
      } else if (language === "es") {
        types = ["entrante", "plato principal", "postre"]
      }
      
      const content = types[this.type - 1];
      const classes = ["type-tag", `recipe-${this.typeString}`];
      tags.push({content, classes});
    }

    for (const tag of this.tags) {
      tags.push({content: tag, classes: ["user-tag"]});
    }

    return tags;
  }

  formatted() {
    let formattedRecipe = new Recipe({...this});

    formattedRecipe.method = this.methodSteps;
    formattedRecipe.tags = this.formattedTags();

    return formattedRecipe;
  }
}

module.exports = Recipe;

function validateInput(body) {
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
    return amount.length <= 0 || Number(amount) !== NaN;
	}))
		return false;

  if (body.recipe_method.length <= 128)
		return false;

	if (!Recipe.recipeTypes.includes(body.recipe_type))
		return false;

	return true;
}