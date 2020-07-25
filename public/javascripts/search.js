if (typeof query_results !== "undefined") {
  displaySearchResults({ recipes: query_results });
}

function search() {
  const search_string = document.getElementById("search-name").value;

  const req = { name: search_string };

  JSONXMLHttpRequest("POST", "/api/search", req)
    .then(displaySearchResults)
    .catch(console.error);
}

function displaySearchResults(results) {
  const list = document.getElementById("search-results");
  list.innerHTML = "";
  
  if (results.recipes.length > 0) {
    for (const result of results.recipes) {
      let new_item = document.createElement("li");
      new_item.classList.add("recipe-result");
      let recipe_link = document.createElement("a");
      recipe_link.href = `${window.location.origin}/recipe/${result.id}`;
      recipe_link.innerText = result.name;
      
      let tags_div = document.createElement("div");
      tags_div.classList.add("tags-container", "inline", "mobile-hidden");
      result.tags.forEach((tag) => {
        let tag_span = document.createElement("span");
        tag_span.innerText = tag;
        tag_span.classList.add("tag");
        tags_div.appendChild(tag_span);
      });
      recipe_link.appendChild(tags_div);

      new_item.appendChild(recipe_link);
  
      list.appendChild(new_item);
    }
  } else {
    addAlert("No se ha encontrado ninguna receta", {
      type: "warning",
      delay: 5000,
      candismiss: true,
      scrollback: true,
    });
  }
  
}
