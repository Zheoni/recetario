const advancedSearchSwitch = document.getElementById("advanced-search-switch").querySelector("input");
const basicSearchInput = document.getElementById("search");
const advancedSearchFieldset = document.getElementById("advanced-search");
const loadingDiv = document.getElementById("loading");
const resultsDiv = document.getElementById("search-results");
const resultTemplate = document.getElementById("result-template");
const form = document.forms["search-form"]

function setAdvancedSearch(isAdvanced) {
  advancedSearchSwitch.checked = isAdvanced;
  basicSearchInput.classList.toggle("hidden", isAdvanced)
  advancedSearchFieldset.classList.toggle("hidden", !isAdvanced);
}

setAdvancedSearch(advancedSearchSwitch.checked);
advancedSearchSwitch.addEventListener("change", (event) => {
  setAdvancedSearch(event.target.checked)
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  search(buildParams());
});

function loadingAnimation(status) {
  loadingDiv.hidden = !status;
  resultsDiv.hidden = status;
}

function buildParams() {
  const formData = new FormData(form);

  const params = new URLSearchParams();
  // if advanced search
  if (advancedSearchSwitch.checked) {
    for (const [name, value] of formData.entries()) {
      if (name === "search") continue;
      else if (value === "") continue;
      else if (name === "cookingTime" && value === "0") continue;
      else if (name === "ingredients") {
        const ingredients = value.split(",")
          .filter(i => i.length > 0)
          .map(i => i.trim())
          .join(",");
          
        params.append("ingredients", ingredients);
      }
      else if (name === "types" && value === "none") continue;
      else params.append(name, value);
    }
  } else {
    const value = formData.get("search");
    if (value !== "") {
      params.append("search", value);
    }
  }

  return params;
}

/**
 * 
 * @param {URLSearchParams} searchParams 
 */
function fillForm(searchParams) {
  // Check type of search
  if (searchParams.has("search")) {
    setAdvancedSearch(false);

    document.getElementById("search").value = searchParams.get("search");
  } else {
    setAdvancedSearch(true);

    document.getElementById("name").value = searchParams.get("name");
    document.getElementById("author").value = searchParams.get("author");

    const ingredients = searchParams.get("ingredients");
    if (ingredients) {
      document.getElementById("ingredients").value = ingredients.split(",").join(", ");
    }

    const tags_div = document.getElementById("tags");
    const tags_container = tags_div.querySelector(".tags-input-container");
    const tags_user_input = tags_div.querySelector(".tags-user-input");
    const tags_input = tags_div.querySelector(".tags-input")
    searchParams.getAll("tags").forEach(tag => {
      addTagToInput(tags_user_input, tags_input, tags_container, null, tag);
    });

    const cookingTime = searchParams.get("cookingTime");
    if (cookingTime) {
      document.getElementById("h").value = Math.floor(cookingTime / 60).toString();
      document.getElementById("m").value = (cookingTime % 60).toString();
      document.getElementById("cookingtimeInput").value = cookingTime.toString();
    }

    document.getElementById("type").value = searchParams.get("types");
  }
}

function showResults(data) {
  if (data.length === 0) {
    addAlert(bundledLocales["alerts.noRecipeFound"], {
      type: "warning",
      delay: 5000,
      candismiss: true,
      scrollback: true,
    });
  }

  for (const recipe of data) {
    const clone = resultTemplate.content.cloneNode(true);

    clone.children[0].href = `/recipe/${recipe.id}`;

    clone.querySelector(".recipe-image").src = recipe.imageURL;
    clone.querySelector(".recipe-name").textContent = recipe.name;

    const tagsContainer = clone.querySelector(".recipe-tags");
    for (const tag of recipe.tags) {
      const tagElement = document.createElement("span");
      tagElement.textContent = tag.name;
      tagElement.classList.add("tag", "user-tag");
      tagsContainer.appendChild(tagElement);
    }

    resultsDiv.appendChild(clone);
  }
}

/**
 * 
 * @param {URLSearchParams} searchParams 
 */
function search(searchParams) {
  if (!searchParams) {
    // if not params given, take them from url
    searchParams = new URLSearchParams(window.location.search);
    fillForm(searchParams);
  } else {
    // else update the url search params with 
    let newUrl;
    if (searchParams.toString().length > 0) {
      newUrl = `${window.location.href.split("?")[0]}?${searchParams}`;
    } else {
      newUrl = window.location.href.split("?")[0];
    }
    window.history.replaceState(null, document.title, newUrl);
  }

  // Hide the content while loading
  loadingAnimation(true);
  resultsDiv.innerHTML = "";

  searchParams.append("attributes", "tags");
  fetch(`/api/search?${searchParams}`)
    .then(response => {
      if (!response.ok) {
        if (response.status == 400) {
          throw 400;
        } else {
          throw new Error('Network response was not ok');
        }
      }
      return response.json();
    })
    .then(data => showResults(data))
    .catch(err => {
      if (err === 400) {
        console.error("Invalid search request")
        addAlert(bundledLocales["alerts.invalidSearch"], {
          type: "error",
          candismiss: true,
          scrollback: true,
        });
      } else {
        console.error(err);
        addAlert(bundledLocales["alerts.cannotSearch"], {
          type: "error",
          candismiss: true,
          scrollback: true,
        });
      }
    })
    .finally(() => loadingAnimation(false));
}

if (window.location.search) {
  search();
}
