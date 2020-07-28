const list = document.getElementById("ingredients");
const template = list.children[list.childElementCount - 1].cloneNode(true);

let sortable = new Sortable(list, {
  handle: ".handle",
  animation: 200,
  touchStartThreshold: 3,
  disabled: list.childElementCount <= 1
});

function addIngredient() {
  const copy = template.cloneNode(true);
  list.appendChild(copy);

  if (list.classList.contains("validate")) {
    const fields = copy.querySelectorAll("input, textarea, select");
    for (let i = 0; i < fields.length; ++i) {
      fields[i].classList.add("validate");
    }
  }
  
  sortable.option("disabled", false);
}

function deleteThisIngredient(ingredient) {
  if (list.childElementCount > 1) {
    const container = ingredient.parentElement;
    container.remove();

    sortable.option("disabled", list.childElementCount <= 1);
  }
}

function isEmpty(element) {
  let fields;
  if (["INPUT", "TEXTAREA", "SELECT"].includes(element.nodeName)) {
    fields = [element];
  } else {
    fields = element.querySelectorAll("input, textarea, select");
  }
  
  for (const field of fields) {
    if (field.value.length !== 0) {
      return false;
    }
  }
  return true;
}

function validate() {

  // Remove empty ingredients, always keeping one
  const ingredients = list.children;
  for (let i = ingredients.length - 1; i >= 0 && ingredients.length > 1; --i) {
    const ingredient = ingredients[i];

    if (isEmpty(ingredient)) {
      ingredient.remove();
    }
  }

  // Add validate class to all user inputs
  const fields = document.querySelectorAll(".form-item > input, .form-item > textarea, .form-item > select");
  
  for (const field of fields) {
    field.classList.add("validate");
  }
  list.classList.add("validate");

  // Validate
  let isValid = document.querySelectorAll(".validate:invalid").length === 0;

  if (ingredients.length === 1 && isEmpty(ingredients[0])) {
    isValid = false;
    list.classList.add("invalid");

    list.addEventListener("keyup", () => {
      let validIngredients = false;
      for (let i = 0; i < ingredients.length && !validIngredients; ++i) {
        const ingredient_name_input = ingredients[i].querySelector("input[name=ingredient]");
        if (ingredient_name_input.value.length > 0)
          validIngredients = true;
      }
      if (validIngredients) {
        list.classList.remove("invalid");
      } else {
        list.classList.add("invalid");
      }
    });
  }

  if (!isValid) {
    addAlert("Revise los campos del formulario que no son correctos e inténtelo de nuevo.", {
      type: "warning",
      scrollback: true
    });
  }

  return isValid;
}


const tags_input = document.getElementById("tags-input");
const tags_user_input = document.getElementById("tags-user-input")
const tags_container = document.getElementById("tags-container");

const tag_regex = /^[0-9A-Za-zñáéíóúäëïöüàèìòùâêîôû\- ]+$/;
const max_tag_length = 25;

function removeTagFromInput(tag) {
  const tag_content = tag.textContent;
  tag.remove();
  tags_input.value = tags_input.value.replace(RegExp(tag_content + ",?"), "");
  tags_input.value = tags_input.value.replace(/,$/, "");
}

tags_user_input.addEventListener("keypress", (event) => {
  if (event.key === "Enter" || event.key === ",") {
    event.preventDefault();
    let tag_content = tags_user_input.value;
    tags_user_input.value = "";

    if (tag_regex.test(tag_content) === false || tag_content.length > max_tag_length) return;

    tag_content = tag_content.replace(",", "-");

    const current_tags = tags_input.value.split(",");

    if (tag_content && !current_tags.includes(tag_content)) {
      // Create the new tag div and add it to the document
      const new_tag_div = document.createElement("div");
      new_tag_div.classList.add("tag-view");
      new_tag_div.textContent = tag_content;
      new_tag_div.onclick = () => removeTagFromInput(new_tag_div);
  
      tags_container.insertBefore(new_tag_div, tags_user_input);

      // Add the tag to the input that will be sent
      if (tags_input.value.length === 0)
        tags_input.value = tag_content;
      else
        tags_input.value += "," + tag_content;
    }
  }
});
