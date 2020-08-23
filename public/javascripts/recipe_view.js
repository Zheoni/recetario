// Tapping on an ingredient marks it
const ingredient_rows = document.querySelectorAll(".ingredients-table tr");

for (let row of ingredient_rows) {
  row.addEventListener("click", (event) => {
    event.currentTarget.classList.toggle("marked");
  });
}

// When on mobile, rescale the title text to fit if needed
function rescaleMobileTitle() {
  if (screen.width < 767) {
    const title = document.getElementById("recipe-name");
    const parent = title.parentElement;

    let current_size = 50;
    title.style.fontSize = current_size + "px";

    while (current_size > 1 && (
      title.offsetWidth > parent.offsetWidth ||
      title.offsetHeight > parent.offsetHeight - 70 ||
      title.scrollWidth > title.offsetWidth
    )) {
      current_size--;
      title.style.fontSize = current_size + "px";
    }
  }
}
rescaleMobileTitle();
window.onresize = rescaleMobileTitle;


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
  if (!window.caches) return;
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
  if (window.caches) {
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
    } catch(err) {
      return null;
    }
  } else {
    return null;
  }
}

async function getUnitID(unit) {
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
    ingredient.originalUnitId = await getUnitID(ingredient.originalUnit);
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

        let valHeur = Math.abs(node.value - 1);

        let intHeur = parts[0] === "0" ? 0 : parts[0].length;

        let decHeur = 0;
        for (const digit of parts[1]) if (digit === "0") ++decHeur;
        decHeur = 1 - decHeur / parts[1].length;

        node.heuristic = valHeur * 0.2 + intHeur * 0.5 + decHeur * 0.3;
        if (intHeur === 0) {
          node.heuristic = (node.heuristic + 1) * 100;
        }

        // console.log(value, valHeur, intHeur, decHeur, node.heuristic);
        return node;
      })
      .sort((a, b) => a.heuristic - b.heuristic)
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

async function convertToUserUnits(ingredients, graph, units) {
  const userUnits = localStorage.getItem("unitSystem") ?? "metric";
  const userBestFit = localStorage.getItem("bestFit") ?? "true";

  for (const ingredient of ingredients) {
    if (ingredient.originalValue && ingredient.originalUnitId) {
      if (ingredient.newUnit === undefined) {
        const result = convertToSystem(graph, units, ingredient.originalValue, ingredient.originalUnitId, {
          system: userUnits,
          bestFit: userBestFit === "true"
        });
  
        ingredient.newUnit = getUnitFromID(units, result.unit);
        ingredient.newValue = result.value;
      }

      ingredient.amountSpan.textContent = ingredient.newValue
        .toFixed(2)
        .replace(/0+$/, "")
        .replace(/\.$/, "");
      ingredient.unitSpan.textContent = ingredient.newUnit.name;
    }

  }
}

function restoreOriginalUnits(ingredients) {
  for (const ingredient of ingredients) {
    ingredient.amountSpan.textContent = ingredient.originalValue;
    ingredient.unitSpan.textContent = ingredient.originalUnit;
  }
}


const convertButton = document.getElementById("convertUnitsButton");

let converted = false;
convertButton.addEventListener("click", async () => {
  const data = await loadData();
  
  if (converted) {
    restoreOriginalUnits(data.ingredients);
    convertButton.classList.remove("activated");
  } else {
    convertToUserUnits(data.ingredients, data.graph, data.units);
    convertButton.classList.add("activated");
  }
  converted = !converted;
});
