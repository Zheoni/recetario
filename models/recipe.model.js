const { body } = require("express-validator");
const fs = require("fs");

const db = require("../db.js").getDB();
const q = require("../queryLoader.js").getQueries();

const { Step } = require("./step.model.js");
const { Ingredient } = require("./ingredient.model.js");
const { Tag } = require("./tag.model.js");

class Recipe {
  static recipeTypes = q["sRecipeTypes"].all();
  static baseImagePath = "/recipes/images/";

  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.author = data.author;
    this.description = data.description;
    this.image = data.image;
    this.type = typeof data.type === "number"
      ? data.type
      : Recipe.recipeTypes.map(type => type.name).indexOf(data.type);
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
    let recipe = new Recipe({
      id: id,
      name: body.name,
      author: body.author,
      description: body.description,
      image: imageName,
      type: body.type,
      CREATED_AT: undefined,
      UPDATED_AT: undefined
    });

    recipe.ingredients = body.ingredient.map((igr, i) => new Ingredient({
      recipe: recipe.id,
      name: igr,
      amount: body.amount[i],
      unit: body.unit[i]
    }));

    recipe.steps = body.step.map((step, i) => new Step({
      recipe: recipe.id,
      content: step,
      type: body.step_type[i]
    }));

    recipe.tags = body.tags.map(tag => new Tag({
      recipe: recipe.id,
      name: tag
    }));

    return recipe;
  }

  formattedTags(locale) {
    let tags = [];
    if (this.type !== 0) {      
      const content = locale.recipeType[Recipe.recipeTypes[this.type].name];
      const classes = ["type-tag", `recipe-${Recipe.recipeTypes[this.type].name}`];
      tags.push({content, classes});
    }

    for (const tag of this.tags) {
      tags.push({content: tag.name, classes: ["user-tag"]});
    }

    return tags;
  }

  formatted(locale) {
    let formattedRecipe = new Recipe({...this});

    formattedRecipe.tags = this.formattedTags(locale);

    return formattedRecipe;
  }

  static checkIfExists(recipeId) {
    return q["sExistRecipe"].pluck().get(recipeId) === 1;
  }

  static getAll() {
    const recipes = q["sAllRecipes"]
      .all()
      .map(row => new Recipe(row));
  
    return recipes;
  }

  static getById(id, options = {}) {
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
      recipe.ingredients = Ingredient.loadIngredients(recipe.id);
    }
    if (options.loadTags || options.all) {
      recipe.tags = Tag.loadTags(recipe.id);
    }
    if (options.loadSteps || options.all) {
      recipe.steps = Step.loadSteps(recipe.id);
    }
  
    return recipe;
  }

  insert() {
    const info = q["iRecipe"].run({
      name: this.name,
      author: this.author,
      desc: this.description,
      img: this.image,
      type: this.type
    });

    this.id = info.lastInsertRowid;

    Ingredient.insertMany(this.ingredients, this.id);
    Tag.insertMany(this.tags, this.id);
    Step.insertMany(this.steps, this.id);
  
    return this.id;
  }

  update(deleteImage = false) {
    let update_object = {
      id: this.id,
      name: this.name,
      author: this.author,
      description: this.description,
      type: this.type
    };

    if (!this.image && !deleteImage) {
      // If image does not change
      q["uRecipeNoImage"].run(update_object);
    } else if (this.image && !deleteImage) {
      // If image changes
      update_object.image = this.image;
      q["uRecipeWithImage"].run(update_object);
    } else if (!this.image && deleteImage) {
      // If image is deleted
      update_object.image = null;
      q["uRecipeWithImage"].run(update_object);
    } else {
      throw new Error("Invalid input, cannot decide if image needs to be updated or deleted.");
    }

    // Delete all relations to the ingredients, add the received ones and
    // remove the ingredients that are not used by any recipe.

    const update_ingredients = db.transaction((recipe) => {
      Ingredient.deleteFromRecipe(recipe.id);
      Ingredient.insertMany(recipe.ingredients)
      Ingredient.deleteUnusedIngredients();
    });
    update_ingredients(this);

    // Do the same with tags
    const update_tags = db.transaction((recipe) => {
      Tag.deleteFromRecipe(recipe.id);
      Tag.insertMany(recipe.tags);
      Tag.deleteUnusedTags();
    });
    update_tags(this);

    // And for steps
    const update_steps = db.transaction((recipe) => {
      Step.deleteFromRecipe(recipe.id);
      Step.insertMany(recipe.steps);
    });
    update_steps(this);
  }

  static deleteById(id, imageName = undefined) {
    // Delete the image
    imageName = imageName || q["sRecipeImage"].pluck().get(id)
    
    if (imageName && imageName !== "noimage.jpeg") {
      const path = "./public" + Recipe.baseImagePath + imageName;
      fs.unlink(path, (err) => {
        if (err) {
          console.error(`Could not delete image for recipe ${id}, path was: \n\t"${path}".`)
        } else {
          console.log(`File: "${path}" was deleted.`);
        }
      });
    }
    
    // Delete the recipe
    q["dRecipe"].run(id);

    // Remove unused ingredients
    Ingredient.deleteUnusedIngredients();
    Tag.deleteUnusedTags();

    console.log("Deleted recipe " + id);
  }

  static searchByName(str, { includeTags = false, limit = 50 } = {}) {
    const results = q.search["sRecipeByName"].all({
      name: `%${str}%`,
      limit: limit
    });
  
    if (includeTags) {
      for (let i = 0; i < results.length; ++i) {
        results[i].tags = Tag.loadTags(results[i].id);
      }
    }
  
    return results;
  }
}

const bodyValidations = [
  body("name")
    .notEmpty()
    .isLength({ max: 128 })
    .trim(),
  body("author")
    .optional()
    .isLength({ max: 64 })
    .trim()
    .customSanitizer(author => author.length === 0 ? null : author),
  body("description")
    .notEmpty()
    .isLength({ max: 256 })
    .trim(),
  body("tags")
    .optional({ checkFalsy: true})
    .customSanitizer(tags => tags
      .split(",")
      .map(tag => tag.trim())
    )
    .custom(tags => tags.every(tag => [
      tag.length > 0,
      tag.match(/^[0-9A-Za-zñáéíóúäëïöüàèìòùâêîôû\- ]+$/)
    ].every(val => val)))
    .customSanitizer(tags => tags),
  body("tags")
    .toArray()
    .customSanitizer(tags => tags.filter(tag => tag.length > 0)),
  body("ingredient")
    .isArray({min: 1}),
  body("ingredient.*")
    .notEmpty()
    .trim(),
  body("amount")
    .isArray({min: 1})
    .custom((amounts, { req }) => amounts.length === req.body.ingredient.length),
  body("amount.*")
    .optional({checkFalsy: true})
    .isNumeric()
    .toFloat(),
  body("unit")
    .isArray({min: 1})
    .custom((units, { req }) => units.length === req.body.ingredient.length),
  body("unit.*")
    .optional({checkFalsy: true})
    .trim(),
  body("step")
    .isArray({min: 1}),
  body("step.*")
    .notEmpty()
    .trim(),
  body("step_type")
    .isArray({min: 1})
    .custom((types, { req }) => types.length === req.body.step.length)
    .custom(types => {
      let foundOne = false;
      let emptySection = false;
      for (let i = 0; i < types.length; ++i) {
        const type = types[i];
    
        if (type === "step") foundOne = true;
    
        if (emptySection) {
          if (type === "section") return false;
    
          if (type === "step") emptySection = false;
        } else if (type === "section") {
          emptySection = true;
        }
      }
  
      return foundOne && !emptySection
    }).withMessage("Bad step_type sequence"),
  body("step_type.*")
    .isIn(Step.stepTypes.map(type => type.name)),
  body("type")
    .isIn(Recipe.recipeTypes.map(type => type.name)),
  body("delete_image")
    .optional()
    .isBoolean()
    .toBoolean()
];

module.exports = { Recipe, bodyValidations };
