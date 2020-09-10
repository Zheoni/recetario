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

  static fromFormInput(body, id = undefined, imageName = undefined) {
    let recipe = new Recipe({
      id: id,
      name: body.name,
      author: body.author,
      description: body.description,
      image: imageName,
      type: body.type,
      cookingTime: body.cookingTime,
      servings: body.servings,
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

  static fromJSONData(data) {
    data.id = undefined;
    let recipe = new Recipe(data);
    recipe.ingredients = recipe.ingredients.map(igr => {
      igr.recipe = undefined;
      return new Ingredient(igr);
    });
    recipe.steps = recipe.steps.map(step => {
      step.recipe = undefined;
      return new Step(step);
    });
    recipe.tags = recipe.tags.map(tag => {
      tag.recipe = undefined;
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

const bodyValidations = [
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
  body("tags")
    .optional({ checkFalsy: true })
    .customSanitizer(tags => tags
      .split(",")
      .map(tag => tag.trim())
    )
    .custom(tags => tags.length <= 5)
    .custom(tags => tags.every(tag => [
      tag.length > 0,
      tag.length <= 20,
      tag.match(/^[0-9A-Za-zñáéíóúäëïöüàèìòùâêîôû\-\+]+$/)
    ].every(val => val)))
    .customSanitizer(tags => tags),
  body("tags")
    .toArray()
    .customSanitizer(tags => tags.filter(tag => tag.length > 0)),
  body("ingredient")
    .isArray({ min: 1 }),
  body("ingredient.*")
    .notEmpty()
    .trim(),
  body("amount")
    .isArray({ min: 1 })
    .custom((amounts, { req }) => amounts.length === req.body.ingredient.length),
  body("amount.*")
    .optional({ checkFalsy: true })
    .isNumeric()
    .toFloat(),
  body("unit")
    .isArray({ min: 1 })
    .custom((units, { req }) => units.length === req.body.ingredient.length),
  body("unit.*")
    .optional({ checkFalsy: true })
    .trim()
    .custom((unit, { req, path }) => {
      unit = unit + "";
      if (unit.length > 0) {
        const match = path.match(/unit\[(\d+)\]/);
        if (!match || match.length < 1) return false;

        const index = Number(match[1]);
        if (index < 0 || req.body.amount.length < index) return false;

        const amount = Number(req.body.amount[index]);
        if (amount <= 0 || amount === null || amount === undefined) return false;
      }

      return true;
    }),
  body("step")
    .isArray({ min: 1 }),
  body("step.*")
    .notEmpty()
    .trim(),
  body("step_type")
    .isArray({ min: 1 })
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
  body("type")
    .isIn(Recipe.recipeTypes.map(type => type.name)),
  body("delete_image")
    .optional()
    .isBoolean()
    .toBoolean()
];

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
  body("type")
    .isInt({ min: 0, max: Recipe.recipeTypes.length - 1 }),
  body("cookingTime")
    .optional({ nullable: true })
    .isInt({ min: 1 }),
  body("servings")
    .optional({ nullable: true })
    .isInt({ min: 1 }),
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
    .notEmpty(),
  body("ingredients.*.amount")
    .optional({ nullable: true })
    .isFloat({ min: 0 }),
  body("ingredients.*.unit")
    .isString(),
  body("steps")
    .isArray({ min: 1 })
    .custom(steps => {
      let foundOne = false;
      let emptySection = false;
      for (let i = 0; i < steps.length; ++i) {
        const type = steps[i]?.type;

        if (type === 0) foundOne = true;

        if (emptySection) {
          if (type === 1) return false;

          if (type === 0) emptySection = false;
        } else if (type === 1) {
          emptySection = true;
        }
      }

      return foundOne && !emptySection
    }).withMessage("Bad step_type sequence"),
  body("steps.*.type")
    .isInt({ min: 0, max: Recipe.recipeTypes.length - 1 }),
  body("steps.*.content")
    .notEmpty(),
  body("tags")
    .isArray({ max: 5 }),
  body("tags.*.name")
    .isLength({ min: 1, max: 20 })
    .matches(/^[0-9A-Za-zñáéíóúäëïöüàèìòùâêîôû\-\+]+$/)
];

module.exports = {
  Recipe,
  bodyValidations,
  JSONValidations
};
