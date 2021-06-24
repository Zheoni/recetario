// Tapping on an ingredient marks it
const ingredient_rows = document.querySelectorAll(".ingredients-table tr");

for (let row of ingredient_rows) {
  row.addEventListener("click", (event) => {
    event.currentTarget.classList.toggle("marked");
  });
}


// Emojis background if needed

const emojiOptions = {
  initialy: 20
}

const imageContainer = document.querySelector(".image-container");

function useEmojiBackground() {
  window.removeEventListener("load", useEmojiBackground);
  const seed = window.location.href.split(/[?#]/)[0]
    .split('')
    .map(s => s.charCodeAt(0))
    .reduce((acc, curr) => acc + curr);
  const charset = getRandomFoodEmojis(14, seed);
  applyUnicodeBackground(imageContainer, charset, emojiOptions);

  let doit;
  window.addEventListener("resize", () => {
    clearTimeout(doit);
    doit = setTimeout(resizedw, 500, charset);
  });
}

function resizedw(charset) {
  applyUnicodeBackground(imageContainer, charset, emojiOptions);
}

window.addEventListener("load", useEmojiBackground);


// Buttons
function deleteRecipe() {
  const r = confirm(bundledLocales["recipeView.confirmDelete"]);

  if (r) {
    const location = window.location;
    const url = [location.protocol, '//', location.host, location.pathname].join('');
    const req = new Request(url, {
      method: "DELETE"
    });

    fetch(req)
      .then(response => {
        if (response.status === 200) {
          return response.json();
        } else {
          throw new Error("Error in delete request");
        }
      })
      .then(response => {
        // Notify to the user
        addAlert(bundledLocales["alerts.recipeDeleted"], {
          type: "warning",
          scrollback: true
        });
        // setTimeout(() => window.location.replace("/"), 1000);
      })
      .catch(error => {
        console.error(error);
        addAlert(bundledLocales["alerts.recipeDeleteError"], {
          type: "error",
          scrollback: true,
          candismiss: true
        });
      })
  }
}










// Load conversion data
async function clearOldCache() {
  if (!window.caches || window.location.protocol !== "https:") return;
  async function check(name) {
    const date = localStorage.getItem(`${name}CacheDate`);
    let data;
    if (date) {
      const params = new URLSearchParams([
        ["name", name],
        ["date", date]
      ]);
      const response = await fetch(`/api/conversions/up-to-date?${params}`);
      data = await response.json();
    }
    if (data?.valid === false) {
      console.log(`Deleting ${name} cache because it is outdated.`);
      localStorage.removeItem(`${name}CacheDate`);
      await window.caches.delete(`recetario-${name}`);
    }
  }

  await Promise.all([
    check("aliases"),
    check("conversions")
  ]);
}

async function fetchFromCache(url, cacheName) {
  if (window.caches && document.location.protocol === "https:") {
    const cache = await window.caches.open(`recetario-${cacheName}`);
    let response = await cache.match(url);

    if (response === undefined) {
      response = await fetch(url);
      cache.put(url, response.clone());
      const timestamp = Date.now();
      localStorage.setItem(`${cacheName}CacheDate`, timestamp);
    }

    return response;
  } else {
    return fetch(url);
  }
}

async function getData(response) {
  if (response.ok) {
    try {
      const data = await response.json();
      return data;
    } catch (err) {
      return null;
    }
  } else {
    return null;
  }
}

async function getUnitID(unit) {
  if (unit === "") return undefined;
  const url = `/api/conversions/find-unit?name=${unit}`;
  const response = await fetchFromCache(url, "aliases");
  const data = await getData(response);
  return data?.id;
}

async function parseIngredients() {
  if (parseIngredients.ingredients) {
    return parseIngredients.ingredients;
  }

  const ingredients = [];

  for (row of ingredient_rows) {
    const amountSpan = row.querySelector("span.ingredient-amount");
    const unitSpan = row.querySelector("span.ingredient-unit");
    const ingredient = {
      amountSpan,
      unitSpan,
      originalValue: Number(amountSpan?.textContent),
      originalUnit: unitSpan?.textContent,
      originalUnitId: undefined
    }

    if (ingredient.originalValue >= 0 && ingredient.originalUnit.length >= 0) {
      ingredient.originalUnitId = await getUnitID(ingredient.originalUnit);
    }
    ingredients.push(ingredient);
  }

  parseIngredients.ingredients = ingredients;
  return ingredients;
}

async function loadGraph() {
  const url = "/api/conversions/graph"
  const response = await fetchFromCache(url, "conversions");
  const data = await getData(response);
  return data;
}

async function loadUnits() {
  const url = "/api/conversions/units";
  const response = await fetchFromCache(url, "units");
  const data = await getData(response);
  return data?.units;
}

// Conversions logic
const deepCopyFunction = (inObject) => {
  let outObject, value, key

  if (typeof inObject !== "object" || inObject === null) {
    return inObject // Return the value if inObject is not an object
  }

  // Create an array or object to hold the values
  outObject = Array.isArray(inObject) ? [] : {}

  for (key in inObject) {
    value = inObject[key]

    // Recursively (deep) copy for nested objects, including arrays
    outObject[key] = deepCopyFunction(value)
  }

  return outObject
}

function getUnitFromID(units, unitID) {
  return units.find(unit => unit.id === unitID);
}

function isUnitSystem(units, unitID, system) {
  return getUnitFromID(units, unitID)?.system === system
}

function getFactor(graph, currentNode) {
  const factorList = [1];

  while (currentNode.parent !== null) {
    const edge = graph[currentNode.parent.id]
      .find((edge) => edge.to === currentNode.id)
    if (edge) {
      factorList.push(edge.factor);
    }
    currentNode = currentNode.parent;
  }

  return factorList.reduce((p, v) => p * v);
}

function searchConversion(graph, units, startUnitID, value, { system = "metric", bestFit = false }) {
  let currentNode = { id: startUnitID, parent: null };
  const visited = new Set();
  visited.add(currentNode.id);
  const queue = [currentNode];

  let validConversions = [];

  while (queue.length > 0) {
    currentNode = queue.shift();

    if (isUnitSystem(units, currentNode.id, system)) {
      if (bestFit) {
        const newValue = value * getFactor(graph, currentNode);

        validConversions.push({
          node: deepCopyFunction(currentNode),
          value: newValue
        });
      } else {
        return currentNode;
      }
    }

    graph[currentNode.id].forEach(edge => {
      const nodeTo = {
        id: edge.to,
        parent: currentNode
      }
      if (!visited.has(nodeTo.id)) {
        visited.add(nodeTo.id);
        queue.push(nodeTo);
      }
    });
  }

  if (validConversions.length !== 0) {
    validConversions = validConversions
      .map(node => {
        const value = node.value.toFixed(5);
        const parts = value.split(".");

        // close to 1
        let valHeur = Math.abs(node.value - 1);

        // less digits in whole portion, better
        let intHeur = parts[0] === "0" ? 0 : parts[0].length;

        // decimal part close to a multiple of 1/4
        let decHeur = 0;
        for (let i = 1; i < 4; ++i) {
          decHeur += Math.abs(node.value - Math.floor(node.value) - 1/i)**2;
        }

        // join all 3 heristics
        node.heuristic = valHeur * 0.3 + intHeur * 0.5 + decHeur * 0.2;

        // penalize numbers without a whole portion
        if (intHeur === 0) {
          node.heuristic += 1000;
        }

        // console.debug(value, valHeur, intHeur, decHeur, node.heuristic);
        return node;
      })
      .sort((a, b) => a.heuristic - b.heuristic)
      // console.debug(validConversions)
    return validConversions[0].node;
  } else {
    return null;
  }
}

function convertToSystem(graph, units, value, unitID, { system, bestFit = true }) {
  if (bestFit === false && isUnitSystem(units, unitID, system)) {
    return { value, unit: unitID };
  }

  resultNode = searchConversion(graph, units, unitID, value, { system, bestFit });

  unitID = resultNode.id

  const factor = getFactor(graph, resultNode);
  value = value * factor;

  return { value, unit: unitID };
}

async function loadData() {
  if (!(loadData.ingredients && loadData.graph && loadData.units)) {
    await clearOldCache();

    [loadData.ingredients, loadData.graph, loadData.units] = await Promise.all([
      parseIngredients(),
      loadGraph(),
      loadUnits()
    ]);
  }

  return {
    ingredients: loadData.ingredients,
    graph: loadData.graph,
    units: loadData.units
  }
}

let lastMulitplier;
async function convertToUserUnits(ingredients, graph, units, multiplier) {
  const userUnits = localStorage.getItem("unitSystem") ?? "metric";
  const userBestFit = (localStorage.getItem("bestFit") ?? "true") === "true";

  for (const ingredient of ingredients) {

    let amountContent = "";
    let unitContent = ingredient.originalUnit;

    if (ingredient.originalValue && ingredient.originalUnitId) {
      if (ingredient.newUnit === undefined || lastMulitplier != multiplier) {
        const result = convertToSystem(graph, units, ingredient.originalValue * multiplier, ingredient.originalUnitId, {
          system: userUnits,
          bestFit: userBestFit
        });

        ingredient.newUnit = getUnitFromID(units, result.unit);
        ingredient.newValue = result.value;
      }

      amountContent = ingredient.newValue;
      unitContent = ingredient.newUnit.name;
    } else if (ingredient.originalValue) {
      amountContent = ingredient.originalValue * multiplier;
    }

    ingredient.unitSpan.textContent = unitContent;
    ingredient.amountSpan.textContent = amountContent.toFixed(2)
      .replace(/0+$/, "")
      .replace(/\.$/, "");

  }

  lastMulitplier = multiplier
}

function restoreOriginalUnits(ingredients, graph, units, multiplier) {
  const userBestFit = (localStorage.getItem("bestFit") ?? "true") === "true";

  for (const ingredient of ingredients) {
    let amountContent = "";
    let unitContent = ingredient.originalUnit;
    if (ingredient.originalValue > 0) {
      if (userBestFit && ingredient.originalUnitId) {
        const result = convertToSystem(graph, units, ingredient.originalValue * multiplier, ingredient.originalUnitId, {
          system: getUnitFromID(units, ingredient.originalUnitId).system,
          bestFit: userBestFit
        });
        amountContent = result.value;
        unitContent = getUnitFromID(units, result.unit).name;
      } else {
        amountContent = ingredient.originalValue * multiplier;
      }
      amountContent = amountContent.toFixed(2)
        .replace(/0+$/, "")
        .replace(/\.$/, "");
    }

    ingredient.amountSpan.textContent = amountContent;
    ingredient.unitSpan.textContent = unitContent;
  }
}

// Ingredient multiplier
const ingredientMultiplierInput = document.getElementById("ingredientMultiplierInput");
let multiplier = 1;

async function changeMultiplier(event) {
  const newServings = Number(event.target.value);
  if (!isFinite(newServings) || newServings < 1)
    return;

  multiplier = newServings / ingredientMultiplierInput.defaultValue;
  console.log(event.target.value, multiplier);

  convert();
}

if (ingredientMultiplierInput) {
  ingredientMultiplierInput.value = ingredientMultiplierInput.defaultValue;
  ingredientMultiplierInput.addEventListener("input", changeMultiplier);
}

const convertButton = document.getElementById("convertUnitsButton");

let needConvert = false;
async function convert() {
  const data = await loadData();

  if (needConvert) {
    convertToUserUnits(data.ingredients, data.graph, data.units, multiplier);
    convertButton.classList.add("activated");
  } else {
    restoreOriginalUnits(data.ingredients, data.graph, data.units, multiplier);
    convertButton.classList.remove("activated");
  }
}

convertButton.addEventListener("click", () => {
  needConvert = !needConvert;
  convert();
});
