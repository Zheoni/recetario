const { body, query, oneOf } = require("express-validator");
const fs = require("fs");

const db = require("../utils/db.js").getDB();
const q = require("../utils/queryLoader.js").getQueries();

const { Step } = require("./step.model.js");
const { Ingredient } = require("./ingredient.model.js");
const { Tag } = require("./tag.model.js");

class Recipe {

  /**
   * @type {{name: string}[]}
   */
  static recipeTypes = q["sRecipeTypes"].all();
  static baseImagePath = "/recipes/images/";

  /**
   * Creates a recipe in memory. Nothing is validated.
   * 
   * @param {Object} data Object with the recipe properties
   * @param {number?} data.id ID. Should be an unique integer greater than 0. `undefined` or `null` if it's a new recipe.
   * @param {string} data.name Name
   * @param {string} data.author Author
   * @param {string} data.description Short description
   * @param {string} data.image Image file name
   * @param {(number|string)} data.type Type of the recipe. If string, will be converted to corresponding number.
   * @param {number} data.cookingTime Cooking time in seconds
   * @param {number} data.servings Number of servings the recipe is for
   * @param {string?} data.CREATED_AT Time when the recipe was created in the database.
   * @param {string?} data.UPDATED_AT Last time when the recipe was edited in the database.
   * @param {Ingredient[]?} data.ingredients Ingredients (instances) of the recipe.
   * @param {Step[]?} data.steps Steps (instances) of the recipe.
   * @param {Tag[]?} data.tags Tags (instaces) of the recipe.
   */
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.author = data.author;
    this.description = data.description;
    this.image = data.image;
    this.imageURL = data.image
      ? Recipe.baseImagePath + (this.image || process.env.DEFAULT_IMAGE)
      : "";
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

  /**
   * 
   * @param {Object} data Object with the recipe data
   * @param {string} data.name Name
   * @param {string} data.author Author
   * @param {string} data.description Short description
   * @param {(number|string)} data.type Type of the recipe. If string, will be converted to corresponding number.
   * @param {number} data.cookingTime Cooking time in seconds
   * @param {number} data.servings Number of servings the recipe is for
   * @param {string?} data.CREATED_AT Time when the recipe was created in the database.
   * @param {string?} data.UPDATED_AT Last time when the recipe was edited in the database.
   * @param {Ingredient[]?} data.ingredients Ingredients of the recipe. Not Ingredient instances.
   * @param {Step[]?} data.steps Steps of the recipe. Not Step instances.
   * @param {Tag[]?} data.tags Tags of the recipe. Not Tag instances.
   * 
   * @param {number} id ID. Should be an unique integer greater than 0. `undefined` or `null` if it's a new recipe.
   * @param {string} image Image file name.
   * 
   * @returns {Recipe} The new recipe.
   */
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

  get typeString() {
    if (this.type >= 0 && this.type <= Recipe.recipeTypes.length)
      return Recipe.recipeTypes[this.type].name;
    else
      throw new Error("Bad recipe type");
  }

  set typeString(type) {
    const typeNumber = Recipe.recipeTypes.map(t => t.name).indexOf(type);
    if (typeNumber < 0)  {
      throw new Error("The type does not exist");
    }
    this.type = typeNumber;
  }

  /**
   * Generates the system tags for the recipe.
   * @param {Object} locale Locale object.
   * 
   * @returns {{name: string, classes: string[]}[]} System tags
   */
  systemTags(locale) {
    let tags = [];
    if (this.type !== 0) {
      const name = locale.recipeType[Recipe.recipeTypes[this.type].name] ?? Recipe.recipeTypes[this.type].name;
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

  /**
   * Checks if a recipe exists in the database based on the ID.
   * @param {number} recipeId ID of the recipe.
   * @returns {boolean} True if the recipe exist, false otherwise.
   */
  static checkIfExists(recipeId) {
    return q["sExistRecipe"].pluck().get(recipeId) === 1;
  }

  /**
   * Returns all the recipes from the database.
   * Only the recipe, not the sub-objects.
   * 
   * @returns {Recipe[]} All the recipes.
   */
  static getAll() {
    const recipes = q["sAllRecipes"]
      .all()
      .map(row => new Recipe(row));

    return recipes;
  }

  /**
   * Gets a recipe based on the ID.
   * @param {number} id ID of the recipe
   * @param {{
   *  loadIngredients: boolean,
   *  loadTags: boolean,
   *  loadSteps: boolean,
   *  all: boolean
   * }} options Selects the inner sub-objects to fetch.
   * @returns {Recipe} The recipe.
   */
  static getById(id, options = {}) {
    const row = q["sRecipe"].get(id);
    const recipe = new Recipe(row);

    recipe.loadAttributes(options);

    return recipe;
  }

  /**
   * Load (or reloads) the ingredients for the recipe.
   * @returns {Ingredient[]} this.ingredients
   */
  loadIngredients() {
    this.ingredients = Ingredient.loadIngredients(this.id);
    return this.ingredients;
  }

  /**
   * Load (or reloads) the tags for the recipe. 
   * @returns {Tag[]} this.tags
   */
  loadTags() {
    this.tags = Tag.loadTags(this.id);
    return this.tags;
  }

  /**
   * Load (or reloads) the steps for the recipe. 
   * @returns {Step[]} this.steps
   */
  loadSteps() {
    this.steps = Step.loadSteps(this.id);
    return this.steps;
  }

  loadAll() {
    this.loadIngredients();
    this.loadTags()
    this.loadSteps()
  }

  /**
   * 
   * @param {{
   *  loadIngredients: boolean,
   *  loadTags: boolean,
   *  loadSteps: boolean,
   *  all: boolean
   * }} options Selects the inner sub-objects to fetch.
   */
  loadAttributes(options) {
    const defaults = {
      loadIngredients: false,
      loadTags: false,
      loadSteps: false,
      all: false
    };
    options = Object.assign({}, defaults, options);

    if (options.all) {
      this.loadAll()
    } else {
      if (options.loadIngredients) {
        this.loadIngredients();
      }
      if (options.loadTags) {
        this.loadTags();
      }
      if (options.loadSteps) {
        this.loadSteps();
      }
    }
  }

  getSteps() {
    if (!this.steps) {
      this.loadSteps();
    }
    return this.steps;
  }

  getIngredients() {
    if (!this.ingredients) {
      this.loadIngredients();
    }
    return this.ingredients;
  }

  getTags() {
    if (!this.tags) {
      this.loadTags();
    }
    return this.tags;
  }

  /**
   * Inserts the recipe into the database. ID is overwritten by a new one.
   */
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

  /**
   * Updates the recipe in the database.
   * @param {boolean} deleteImage If `true` deletes the image.
   */
  update(deleteImage = false) {
    let update_object = {...this};

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

  /**
   * Deletes a recipe from the database and its image.
   * @param {number} id ID of the recipe
   * @param {string} imageName Name of the image
   */
  static async deleteById(id, imageName = undefined) {
    // Delete the image
    imageName = imageName || q["sRecipeImage"].pluck().get(id);

    let deleteImagePromise;
    let path;

    if (imageName && imageName !== "noimage.jpeg") {
      path = "./public" + Recipe.baseImagePath + imageName;
      deleteImagePromise = fs.promises.unlink(path);
    }

    // Delete the recipe
    q["dRecipe"].run(id);

    // Remove unused ingredients
    Ingredient.deleteUnusedIngredients();
    Tag.deleteUnusedTags();

    console.log("Deleted recipe " + id);
    await deleteImagePromise.then((err) => {
      if (err) {
        console.error(`Could not delete image for recipe ${id}, path was: \n\t"${path}".`)
      } else {
        console.log(`File: "${path}" was deleted.`);
      }
    });
  }

  async delete() {
    await Recipe.deleteById(this.id, this.image);
  }

  /**
   * Search for recipes
   * 
   * @param {Object} data Search data
   * @param {string} [data.name] Check if name is in the name of the recipe
   * @param {string[]} [data.authors] Recipes whose authors constains at least one of the given strings.
   * @param {number[]|string[]} [data.types] Recipes that belongs to one of the given types.
   * @param {string[][]} [data.tags] Tags groups. Union of the recipes that have the all the tags in a tag group.
   * @param {number} [data.cookingTime] All recipes that have less or equal cooking time.
   * @param {string[][]} [data.ingredients] Ingredient groups. Union of the recipes that have all the ingredients in a ingredient group.
   * 
   * @param {Object} sort Sorting of the recipes.
   * 
   * @param {Object} [options] Options for the search
   * @param {number} [options.limit=50] Limit of recipes to find. Defautls to 50. If null, no limit.
   * @param {{
   *  attribute: "name"|"author"|"type"|"cookingTime",
   *  order: "ASC"|"DESC"}[]
   * } [options.sort] Sort the results.
   * 
   * @param {{
    *  loadIngredients: boolean,
    *  loadTags: boolean,
    *  loadSteps: boolean,
    *  all: boolean
    * }} [options.attributes] Selects the inner sub-objects to fetch.
   * 
   * @returns {Recipe[]} Results
   */
  static search(data, options = {}) {
    // Maybe use a query builder instead of doing it manually
    let query = "SELECT * FROM RECIPES WHERE ";

    if (data.name) {
      query += `name LIKE '%${data.name}%' AND `;
    }

    if (data.authors && data.authors.length > 0) {
      query += "(";
      for (let i = 0; i < data.authors.length; ++i) {
        query += `author LIKE '%${data.authors[i]}%'`;
        if (i !== data.authors.length - 1) query += " OR ";
      }
      query += ") AND ";
    }

    if (data.types && data.types.length > 0) {
      query += "(";
      for (let i = 0; i < data.types.length; ++i) {
        let type = data.types[i];
        if (typeof type === "string") {
          type = Recipe.recipeTypes.map(t => t.name).indexOf(type);
        }

        query += `type = ${type}`
        if (i !== data.types.length - 1) query += " OR ";
      }
      query += ") AND ";
    }

    if (data.tags && data.tags.length > 0) {
      query += "(";
      for (let j = 0; j < data.tags.length; ++j) {
        const tagGroup = data.tags[j];
        if (tagGroup.length > 0) {
          query += `(RECIPES.id IN (SELECT RT.recipe FROM RECIPE_TAGS RT INNER JOIN TAGS T ON T.id = RT.tag WHERE T.name IN ('${tagGroup.join("','")}') GROUP BY RT.recipe HAVING COUNT(*) = ${tagGroup.length}))`;
          if (j !== data.tags.length - 1) query += " OR "
        }
      }
      query += ") AND "
    }

    if (data.cookingTime) {
      query += `cookingTime <= ${data.cookingTime} AND `
    }

    if (data.ingredients && data.ingredients.length > 0) {
      query += "(";
      for (let j = 0; j < data.ingredients.length; ++j) {
        const ingredientGroup = data.ingredients[j];
        if (ingredientGroup.length > 0) {
          // Maybe improve this by using a spellfix virtual table
          let spellfix_query = "";
          for (let k = 0; k < ingredientGroup.length; ++k) {
            const ingredient = ingredientGroup[k];
            spellfix_query += `(editdist3(I.name, '${ingredient}') < 450)`;
            if (k < ingredientGroup.length - 1) {
              spellfix_query += " OR ";
            }
          }
          query += `(RECIPES.id IN (SELECT RI.recipe FROM RECIPE_INGREDIENTS RI INNER JOIN INGREDIENTS I ON I.id = RI.ingredient WHERE ${spellfix_query} GROUP BY RI.recipe HAVING COUNT(*) = ${ingredientGroup.length}))`;
          if (j !== data.ingredients.length - 1) query += " OR "
        }
      }
      query += ") AND "
    }

    if (query.endsWith("AND "))
      query = query.slice(0, query.length - 4);
    else
      query = query.slice(0, query.length - 6);

    query += "GROUP BY RECIPES.id ";

    if (options.sort && options.sort.length > 0) {
      query += "ORDER BY "
      for (let i = 0; i < options.sort.length; ++i) {
        const rule = options.sort[i];
        query += `RECIPES.${rule.attribute} ${rule.order}`;
        if (i !== options.sort.length - 1) query += ", ";
      }
    }

    if (options.limit === undefined) options.limit = 50;
    if (options.limit) {
      query += ` LIMIT ${options.limit} `;
    }

    const results = db.prepare(query).all().map(row => new Recipe(row));

    if (options.attributes) {
      results.forEach(r => r.loadAttributes(options.attributes));
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

const safeStringRegex = /^[\s\d\p{L}&,\.$€ç%°ºª?¿!¡\-:]+$/iu;

const searchValidations = [
  query("search").optional().notEmpty().matches(safeStringRegex),
  query("name").optional().notEmpty().matches(safeStringRegex),
  query("authors").optional().toArray().isArray({ min: 1 }),
  query("authors.*").isString().notEmpty().matches(safeStringRegex),
  query("types").optional().toArray().isArray({ min: 1 }),
  oneOf([
    query("types.*").isInt({ max: Recipe.recipeTypes.length - 1 }).toInt(),
    query("types.*").isString().isIn(Recipe.recipeTypes.map(r => r.name))
  ]),
  query("cookingTime").optional().isInt({ min: 1}).toInt(),
  query("tags").optional().toArray().isArray({ min: 1 }),
  query("tags.*")
    .customSanitizer((val) => val.split(",").filter(t => t.length > 0))
    .custom(tags => tags.every(tag => tag.match(/^[0-9A-Za-zñáéíóúäëïöüàèìòùâêîôû\-\+]+$/)))
    .isArray({ min: 1 }),
  query("ingredients").optional().toArray().isArray({ min: 1 }),
  query("ingredients.*")
    .customSanitizer((val) => val.split(",").filter(i => i.length > 0))
    .custom(ingredients => ingredients.every(ingredient => ingredient.match(safeStringRegex)))
    .isArray({ min: 1 }),


  query("limit").optional().isInt({ min: 1 }).toInt(),
  query("sort").optional().toArray().isArray({ min: 1 }),
  query("sort.*")
    .matches(/^(name|author|type|cookingTime)(_(ASC|DESC))?$/)
    .customSanitizer(val => {
      const parts = val.split("_");
      if (parts.length === 1) parts.push("ASC");
      return {
        attribute: parts[0],
        order: parts[1]
      }
    }),
  query("attributes").optional().toArray().isArray({ min: 1 }),
  query("attributes.*")
    .isIn(["all", "ingredients", "tags", "steps"])
]

module.exports = {
  Recipe,
  JSONValidations,
  searchValidations,
  safeStringRegex
};
