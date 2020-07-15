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
  const list = document.getElementById("ingredients");
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

  // Validate
  const isValid = document.querySelectorAll(".validate:invalid").length === 0;
  return isValid;
}
