const { body } = require("express-validator");

class Recipe {
  static recipeTypes = ["none", "starter", "main", "dessert"];
  static baseImagePath = "/recipes/images/";

  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.author = data.author;
    this.description = data.description;
    this.image = data.image;
    this.type = data.type;
    this.CREATED_AT = data.CREATED_AT;
    this.UPDATED_AT = data.UPDATED_AT;
    
    this.ingredients = data.ingredients;
    this.steps = data.steps;
    this.tags = data.tags;
  }

  get imageURL() {
    return Recipe.baseImagePath + (this.image || "noimage.jpeg");
  }

  static fromFormInput(body, id = undefined, imageName = undefined) {
    if (body.author.length <= 0) {
      body.recipe_author = null;
    }

    const type_number = Recipe.recipeTypes.indexOf(body.type);
    if (type_number < 0) type_number = 0;

    let recipe = new Recipe({
      id: id,
      name: body.name,
      author: body.author,
      description: body.description,
      image: imageName,
      type: type_number,
      CREATED_AT: undefined,
      UPDATED_AT: undefined
    });

    recipe.ingredients = body.ingredient.map((igr, i) => {
      return { name: igr, amount: body.amount[i], unit: body.unit[i] };
    });

    recipe.steps = body.step.map((step, i) => {
      return { content: step, type: body.step_type[i] }; 
    })

    recipe.tags = body.tags;

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

    formattedRecipe.tags = this.formattedTags();

    return formattedRecipe;
  }
}

const recipeValidations = [
  body("name")
    .notEmpty()
    .isLength({ max: 128 })
    .trim(),
  body("author")
    .optional()
    .isLength({ max: 64 })
    .trim(),
  body("description")
    .notEmpty()
    .isLength({ max: 256 })
    .trim(),
  body("tags")
    .optional()
    .customSanitizer(tags => tags.split(",").map(tag => tag.trim()))
    .custom(tags => tags.every(tag => [
      tag.length > 0,
      tag.match(/^[0-9A-Za-zñáéíóúäëïöüàèìòùâêîôû\- ]+$/)
    ].every(val => val))),
  body("ingredient")
    .toArray()
    .notEmpty(),
  body("ingredient.*")
    .notEmpty()
    .trim(),
  body("amount")
    .toArray()
    .custom((amounts, { req }) => amounts.length === req.body.ingredient.length),
  body("amount.*")
    .optional()
    .isNumeric()
    .toFloat(),
  body("unit")
    .toArray()
    .custom((units, { req }) => units.length === req.body.ingredient.length),
  body("unit.*")
    .optional()
    .trim(),
  body("step")
    .toArray()
    .notEmpty(),
  body("step.*")
    .notEmpty()
    .trim(),
  body("step_type.*")
    .notEmpty()
    .toInt()
    .custom(type => type >= 0 && type <= 2),
  body("step_type")
    .toArray()
    .notEmpty()
    .custom((types, { req }) => types.length === req.body.step.length)
    .custom(types => {
      let foundOne = false;
      let emptySection = false;
      for (let i = 0; i < types.length; ++i) {
        const type = types[i];
    
        if (type === 0) foundOne = true;
    
        if (emptySection) {
          if (type === 1) return false;
    
          if (type === 0) emptySection = false;
        } else if (type === 1) {
          emptySection = true;
        }
      }
  
      return foundOne && !emptySection
    }),
  body("type")
    .isIn(Recipe.recipeTypes),
  body("delete_image")
    .optional()
    .isBoolean()
    .toBoolean()
];

module.exports = { Recipe, recipeValidations };
