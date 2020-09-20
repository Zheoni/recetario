const { body, oneOf } = require("express-validator");
const fs = require("fs");

const db = require("../utils/db.js").getDB();
const q = require("../utils/queryLoader.js").getQueries();

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
    this.cookingTime = data.cookingTime;
    this.servings = data.servings;
    this.CREATED_AT = data.CREATED_AT;
    this.UPDATED_AT = data.UPDATED_AT;

    this.ingredients = data.ingredients;
    this.steps = data.steps;
    this.tags = data.tags;
  }

  get imageURL() {
    if (this.image) {
      return Recipe.baseImagePath + (this.image || process.env.DEFAULT_IMAGE);
    } else {
      return "";
    }
  }

  static fromJSONData(data, id = undefined, image = undefined) {
    data.id = id;
    data.image = image;
    let recipe = new Recipe(data);
    recipe.ingredients = recipe.ingredients.map(igr => {
      igr.recipe = id;
      return new Ingredient(igr);
    });
    recipe.steps = recipe.steps.map(step => {
      step.recipe = id;
      return new Step(step);
    });
    recipe.tags = recipe.tags.map(tag => {
      tag.recipe = id;
      return new Tag(tag);
    });
    return recipe;
  }

  systemTags(locale) {
    let tags = [];
    if (this.type !== 0) {
      const name = locale.recipeType[Recipe.recipeTypes[this.type].name];
      const classes = ["type-tag", `recipe-${Recipe.recipeTypes[this.type].name}`];
      tags.push({ name, classes });
    }

    if (this.cookingTime) {
      const hours = Math.floor(this.cookingTime / 60);
      const minutes = this.cookingTime % 60;

      let name = "";
      if (hours) {
        name += hours + "h";
      }
      if (minutes) {
        name += (name ? " " : "") + minutes + "min";
      }

      const classes = ["time-tag"];
      tags.push({ name, classes });
    }

    if (this.servings) {
      const name = this.servings.toString();
      const classes = ["servings-tag"];
      tags.push({ name, classes });
    }

    return tags;
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
    const recipe = new Recipe(row);

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
      type: this.type,
      cookingTime: this.cookingTime,
      servings: this.servings
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
      type: this.type,
      cookingTime: this.cookingTime,
      servings: this.servings
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

function emptyStringToNullSanitizer(value) {
  return value.length > 0 ? value : null;
}


const JSONValidations = [
  body("name")
    .notEmpty()
    .isLength({ max: 128 })
    .trim(),
  body("author")
    .customSanitizer(emptyStringToNullSanitizer)
    .optional({ nullable: true })
    .isLength({ max: 64 })
    .trim(),
  body("description")
    .notEmpty()
    .isLength({ max: 256 })
    .trim(),
  body("image")
    .optional({ nullable: true })
    .matches(/^[\w\d]+(.[\w\d]+)?$/),
  oneOf([
    body("type")
      .isInt({ min: 0, max: Recipe.recipeTypes.length - 1 })
      .toInt()
      .withMessage("Type is not int"),
    body("type")
      .isIn(Recipe.recipeTypes.map(t => t.name))
      .withMessage("Type is not in recipeTypes")
  ]),
  body("cookingTime")
    .customSanitizer(emptyStringToNullSanitizer)
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .toInt(),
  body("servings")
    .customSanitizer(emptyStringToNullSanitizer)
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .toInt(),
  body(["CREATED_AT", "UPDATED_AT"])
    .customSanitizer(emptyStringToNullSanitizer)
    .optional({ nullable: true })
    .matches(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/),
  body("ingredients")
    .isArray({ min: 1 })
    .custom((igr) => {
      const unit = igr.unit + "";
      const amount = Number(igr.amount);
      if (unit.length > 0 && (amount <= 0 || amount === null || amount === undefined)) {
        return false;
      } else {
        return true;
      }
    }),
  body("ingredients.*.name")
    .notEmpty()
    .trim(),
  body("ingredients.*.amount")
    .customSanitizer(emptyStringToNullSanitizer)
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .toFloat(),
  body("ingredients.*.unit")
    .isString()
    .trim(),
  body("steps")
    .isArray({ min: 1 })
    .custom(steps => {
      let foundOne = false;
      let emptySection = false;
      for (let i = 0; i < steps.length; ++i) {
        let type = steps[i]?.type;      

        if (type === 0 || type === "step") foundOne = true;

        if (emptySection) {
          if (type === 1 || type === "section") return false;

          if (type === 0 || type === "step") emptySection = false;
        } else if (type === 1 || type === "section") {
          emptySection = true;
        }
      }

      return foundOne && !emptySection
    }).withMessage("Bad step_type sequence"),
  oneOf([
    body("steps.*.type")
      .isIn(Step.stepTypes.map(t => t.name)),
    body("steps.*.type")
      .isInt({ min: 0, max: Step.stepTypes.length - 1 })
      .toInt()
  ]),
  body("steps.*.content")
    .notEmpty(),
  body("tags")
    .isArray({ max: 5 }),
  body("tags.*.name")
    .isLength({ min: 1, max: 20 })
    .matches(/^[0-9A-Za-zñáéíóúäëïöüàèìòùâêîôû\-\+]+$/),
  body("delete_image")
    .optional()
    .isBoolean()
    .toBoolean()
];

module.exports = {
  Recipe,
  JSONValidations
};
