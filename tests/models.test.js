// Create database in memory for the tests

const dbManager = require("../utils/db.js");
const fs = require("fs");
const path = require("path");

dbManager.initDB(":memory:");
let db = dbManager.getDB();

const schema = fs.readFileSync(
  path.resolve(__dirname, "..", "models", "recipes.sql"),
  "utf-8");
db.exec(schema);

const data = fs.readFileSync(
  path.resolve(__dirname, "testdata.sql"),
  "utf-8");
db.exec(data);

let q = require("../utils/queryLoader.js");
q.loadQueriesFrom(
  path.resolve(__dirname, "..", "queries"),
  { recursive: true }
);

const loc = require("../utils/localeLoader.js");
loc.loadLoacales(
  path.resolve(__dirname, "..", "locales")
);
console.log = jest.fn()
afterAll(() => {
  dbManager.closeDB();
});

function reinitializeDatabase() {
  const tables = db.prepare("select name from sqlite_master where type is 'table'").pluck().all();
  db.pragma("foreign_keys = 0");
  for (let table of tables) {
    if (table !== "sqlite_sequence")
      db.exec(`drop table ${table}`);
  }
  db.pragma("foreign_keys = 1");
  db.exec(schema);
  db.exec(data);
}

const { Tag } = require("../models/tag.model.js");
const { Step } = require("../models/step.model.js");
const { Ingredient } = require("../models/ingredient.model.js");
const { Recipe } = require("../models/recipe.model.js");

try {
  fs.mkdirSync(path.join(__dirname, "..", "public", Recipe.baseImagePath), { recursive: true });
} catch (error) {
  console.error(error);
  process.exit(1);
}

describe('ingredient', () => {
  const ingredients = Ingredient.loadIngredients(1);
  describe('ingredient constructors', () => {
    test('ingredient constructor ok', () => {
      const igr = new Ingredient(ingredients[0]);
      expect(igr).toEqual(ingredients[0]);
    });

    test('ingredient loadIngredients', () => {
      const ingredients = Ingredient.loadIngredients(1);
      for (let igr of ingredients)
        expect(igr.recipe).toBe(1);
      expect(ingredients.length).toBe(4);
    });
  });

  describe('ingredient database interaction', () => {
    test('insert ingredient', () => {
      const igr = new Ingredient({
        recipe: 1,
        name: "pp",
        amount: 4,
        unit: "t" 
      });
      igr.insert();
      const recipeIngredients = Ingredient.loadIngredients(1);
      expect(recipeIngredients).toContainEqual(igr);
    });

    test('delete ingredients', () => {
      Ingredient.deleteFromRecipe(1);
      const ingredients = Ingredient.loadIngredients(1);
      expect(ingredients.length).toBe(0);
    });

    test('delete unused ingredients', () => {
      const countUnusedIngredients = db.prepare("SELECT COUNT(*) FROM INGREDIENTS WHERE (SELECT COUNT(*) FROM RECIPE_INGREDIENTS WHERE INGREDIENTS.id = RECIPE_INGREDIENTS.ingredient) = 0");

      expect(countUnusedIngredients.pluck().get()).toBe(2);
      Ingredient.deleteUnusedIngredients();
      expect(countUnusedIngredients.pluck().get()).toBe(0);
      reinitializeDatabase();
    });
  });
});

describe('step', () => {
  const steps = Step.loadSteps(1);
  describe('step constructors', () => {
    test('step constructor ok', () => {
      const step = new Step(steps[0]);
      expect(step).toEqual(steps[0]);
    });

    test('step loadSteps', () => {
      const steps = Step.loadSteps(1);
      for (let step of steps)
        expect(step.recipe).toBe(1);
      expect(steps.length).toBe(8);
    });
  });

  describe('step database interaction', () => {
    test('insert step', () => {
      const step = new Step({
        recipe: 1,
        type: "step",
        content: "owo"
      });
      step.insert();
      const recipeSteps = Step.loadSteps(1);
      expect(recipeSteps).toContainEqual(step);
    });

    test('delete steps', () => {
      Step.deleteFromRecipe(1);
      const steps = Step.loadSteps(1);
      expect(steps.length).toBe(0);
      reinitializeDatabase();
    });
  });
});

describe('tag', () => {
  const tags = Tag.loadTags(1);
  describe('tag constructors', () => {
    test('tag constructor ok', () => {
      const tag = new Tag(tags[0]);
      expect(tag).toEqual(tags[0]);
    });

    test('tag loadTags', () => {
      const tags = Tag.loadTags(1);
      for (let tag of tags)
        expect(tag.recipe).toBe(1);
      expect(tags.length).toBe(3);
    });
  });

  describe('tag database interaction', () => {
    test('insert tag', () => {
      const tag = new Tag({
        name: "thiccc",
        recipe: 1,
      });
      tag.insert();
      const recipeTags = Tag.loadTags(1);
      expect(recipeTags).toContainEqual(tag);
    });

    test('delete tag', () => {
      Tag.deleteFromRecipe(1);
      const tags = Tag.loadTags(1);
      expect(tags.length).toBe(0);
    });

    test('delete unused tags', () => {
      const countUnusedTags = db.prepare("SELECT COUNT(*) FROM TAGS WHERE (SELECT COUNT(*) FROM RECIPE_TAGS WHERE TAGS.id = RECIPE_TAGS.tag) = 0");

      expect(countUnusedTags.pluck().get()).toBe(4);
      Tag.deleteUnusedTags();
      expect(countUnusedTags.pluck().get()).toBe(0);
      reinitializeDatabase();
    });
  });
});

describe('recipe', () => {
  const recipe = Recipe.getById(1, { all: true });
  
  describe('recipe constructors', () => {
    test('recipe contructor ok number type', () => {
      const r = new Recipe({...recipe});
      expect(r).toEqual(recipe);
    });
    
    test('recipe constructor ok string type', () => {
      let data = {...recipe};
      data.type = "starter";
      const r = new Recipe(data);
      expect(r).toEqual(recipe);
    });
    
    test('recipe constructor wrong string type', () => {
      let data = {...recipe};
      data.type = "dessert";
      const r = new Recipe(data);
      expect(r).not.toEqual(recipe);
    });
    
    test('recipe constructor undefined string type', () => {
      let data = {...recipe};
      data.type = "not a recipe type";
      const r = new Recipe(data);
      expect(r).not.toEqual(recipe);
      expect(r.type).toBe(-1);
    });
        
    test('recipe from full JSON', () => {
      const recipe = Recipe.getById(1, { all: true });
      const r = Recipe.fromJSONData(JSON.parse(JSON.stringify(recipe)));
      delete recipe.id;
      delete recipe.image;
      for (let igr of recipe.ingredients) {
        delete igr.recipe;
      }
      for (let tag of recipe.tags) {
        delete tag.recipe;
      }
      for (let step of recipe.steps) {
        delete step.recipe;
      }
    
      expect(r).toEqual(recipe);
    });
    
    test('recipe from JSON without IDs', () => {
      const recipe = Recipe.getById(1, { all: true });
      delete recipe.id;
      delete recipe.image;
      for (let igr of recipe.ingredients) {
        delete igr.recipe;
      }
      for (let tag of recipe.tags) {
        delete tag.recipe;
      }
      for (let step of recipe.steps) {
        delete step.recipe;
      }
      const r = Recipe.fromJSONData(JSON.parse(JSON.stringify(recipe)));
    
      expect(r).toEqual(recipe);
    });
  });

  describe('recipe methods', () => {
    test('recipe imageURL', () => {
      const url = recipe.imageURL;
      expect(url).toMatch(new RegExp("(\/.+)+\/" + recipe.image));
    });

    test('recipe systemTags', () => {
      const recipe = Recipe.getById(2);
      const expectedTags = [
        { name: 'Plato principal', classes: [ 'type-tag', 'recipe-main' ] },
        { name: '30min', classes: [ 'time-tag' ] },
        { name: '2', classes: [ 'servings-tag' ] }
      ]
      const calculatedTags = recipe.systemTags(loc.getLocale("es"));
      expect(calculatedTags).toEqual(expectedTags);
    });

    test('recipe systemTags different language', () => {
      const recipe = Recipe.getById(2);
      const expectedTags = [
        { name: 'Main dish', classes: [ 'type-tag', 'recipe-main' ] },
        { name: '30min', classes: [ 'time-tag' ] },
        { name: '2', classes: [ 'servings-tag' ] }
      ];
      const calculatedTags = recipe.systemTags(loc.getLocale("en"));
      expect(calculatedTags).toEqual(expectedTags);
    });

    
  });

  describe('recipe database interaction', () => {
    test('recipe checkIfExists, exist', () => {
      expect(Recipe.checkIfExists(1)).toBe(true);
    });

    test('recipe checkIfExists, does not exist', () => {
      expect(Recipe.checkIfExists(14)).toBe(false);
    });

    test('recipe getAll', () => {
      const recipes = Recipe.getAll();
      expect(recipes.map(r => r.id)).toEqual([1, 2]);
      recipes[0].loadIngredients();
      recipes[0].loadSteps();
      recipes[0].loadTags();
      expect(recipes[0]).toEqual(recipe);
    });

    test('recipe getById', () => {
      const recipe = Recipe.getById(1);
      const recipe2 = Recipe.getById(1, { loadIngredients: true });
      const recipe3 = Recipe.getById(1, { loadTags: true });
      const recipe4 = Recipe.getById(1, { loadSteps: true });
      const recipe5 = Recipe.getById(1, { all: true });

      expect(recipe.ingredients).toBe(undefined);
      expect(recipe.tags).toBe(undefined);
      expect(recipe.steps).toBe(undefined);
      expect(recipe2.ingredients).toEqual(recipe5.ingredients);
      expect(recipe2.tags).toBe(undefined);
      expect(recipe2.steps).toBe(undefined);

      recipe.ingredients = recipe2.ingredients;
      recipe.tags = recipe3.tags;
      recipe.steps = recipe4.steps;
      expect(recipe).toEqual(recipe5);
    });

    test('recipe insert and delete', async () => {
      const originalID = 1;
      const original = Recipe.getById(originalID, { all: true });
      const copyID = original.insert();

      expect(Recipe.checkIfExists(copyID)).toBe(true);
      expect(originalID).not.toEqual(copyID);

      const copy = Recipe.getById(copyID, { all: true });

      delete original.id;
      delete copy.id;
      delete original.CREATED_AT;
      delete original.UPDATED_AT;
      delete copy.CREATED_AT;
      delete copy.UPDATED_AT;
      expect(original).toEqual(copy);
      
      
      
      copy.id = copyID;
      fs.writeFileSync(path.join(__dirname, "..", "public", Recipe.baseImagePath, "fakeimage"), "~~uwu~~");
      copy.image = "fakeimage";
      await copy.delete();
      expect(Recipe.checkIfExists(copyID)).toBe(false);
      expect(Recipe.checkIfExists(originalID)).toBe(true);
    });

    test('recipe update', () => {
      recipe.name = "updated name";
      recipe.author = "updated author";
      recipe.description = "updated description";
      recipe.ingredients[0].name = "updated ingredient";
      const originalID = recipe.id;
      recipe.update();
      const updated = Recipe.getById(originalID, { loadIngredients: true });
      expect(updated.id).toBe(originalID);
      expect(updated.CREATED_AT).toEqual(recipe.CREATED_AT);
      expect(updated.UPDATED_AT).not.toEqual(recipe.UPDATED_AT);
      expect(updated.name).toEqual("updated name");
      expect(updated.author).toEqual("updated author");
      expect(updated.description).toEqual("updated description");
      expect(updated.ingredients[0].name).toEqual("updated ingredient");
    });
  });
});
