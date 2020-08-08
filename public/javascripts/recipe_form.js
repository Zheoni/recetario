function isEmpty(element) {
  let fields;
  if (["INPUT", "TEXTAREA", "SELECT"].includes(element.nodeName)) {
    fields = [element];
  } else {
    fields = element.querySelectorAll("input, textarea, select");
  }
  
  for (const field of fields) {
    if (field.value.length !== 0 && field.type !== "hidden") {
      return false;
    }
  }
  return true;
}

// Tags
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

tags_user_input.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === "," || event.key === "Tab") {
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
  } else if (event.key === "Backspace" && tags_user_input.value.length === 0) {
    event.preventDefault();
    if (tags_container.childElementCount >= 4) {
      const tag = tags_container.children[tags_container.childElementCount - 4];
      removeTagFromInput(tag);
    }
  }
});

// Ingredients
const ingredients_list = document.getElementById("ingredients");
const ingredient_template = ingredients_list.children[ingredients_list.childElementCount - 1].cloneNode(true);

if (document.getElementById("current-page").content === "edit") {
  const lastElement = ingredients_list.children[ingredients_list.childElementCount - 1]
  if (isEmpty(lastElement)) {
    lastElement.remove();
  }
}

let sortable_ingredients = new Sortable(ingredients_list, {
  handle: ".handle",
  animation: 200,
  touchStartThreshold: 3,
  disabled: ingredients_list.childElementCount <= 1
});

function addIngredient() {
  const copy = ingredient_template.cloneNode(true);
  ingredients_list.appendChild(copy);

  if (ingredients_list.classList.contains("validate")) {
    const fields = copy.querySelectorAll("input, textarea, select");
    for (let i = 0; i < fields.length; ++i) {
      fields[i].classList.add("validate");
    }
  }
  
  sortable_ingredients.option("disabled", false);
}

function deleteThisIngredient(ingredient) {
  if (ingredients_list.childElementCount > 1) {
    const container = ingredient.parentElement;
    container.remove();

    sortable_ingredients.option("disabled", ingredients_list.childElementCount <= 1);

    if (ingredients_list.classList.contains("validate")) {
      validateIngredients();
    }
  }
}


// Steps
const steps_list = document.getElementById("method");
const step_template = steps_list.children[steps_list.childElementCount - 1].cloneNode(true);

if (document.getElementById("current-page").content === "edit") {
  const lastElement = steps_list.children[steps_list.childElementCount - 1]
  if (isEmpty(lastElement)) {
    lastElement.remove();
  }
}

let sortable_steps = new Sortable(steps_list, {
  handle: ".handle",
  animation: 200,
  touchStartThreshold: 3,
  disabled: steps_list.childElementCount <= 1
});

function getStepType(step) {
  if (step.classList.contains("step-section")) {
    return 1;
  } else if (step.classList.contains("step-note")) {
    return 2;
  } else {
    return 0;
  }
}

function addStep() {
  const select_element = document.getElementById("new-step-type")
  const select_type = select_element.selectedIndex;

  const validate = steps_list.classList.contains("validate");
  
  let new_element = step_template.cloneNode(true);
  switch (select_type) {
    default: case 0: {
      if (validate) {
        new_element.children[1].classList.add("validate");
      }
    }
    break;
    case 1: {
      const input = document.createElement("input");
      input.type = "text";
      input.required = true;
      input.maxLength = 128;
      input.setAttribute("name", "step[]");
      new_element.replaceChild(input,new_element.children[1]);

      const section = document.createElement("strong");
      section.textContent = "Sección: ";
      new_element.insertBefore(section, input);

      new_element.classList.add("step-section");

      if (validate) {
        input.classList.add("validate");
      }
    }
    break;
    case 2: {
      new_element.children[1].required = false;
      new_element.classList.add("step-note");
      if (validate) {
        new_element.children[1].classList.add("validate");
      }
    }
    break;
  }
  const type_input = new_element.querySelector('[name="step_type[]"]');
  type_input.value = select_element.value;

  steps_list.appendChild(new_element);
  select_element.selectedIndex = 0;

  sortable_steps.option("disabled", false);

  if (steps_list.classList.contains("validate")) {
    validateSteps();
  }
}

function deleteThisStep(step) {
  if (steps_list.childElementCount > 1) {
    const container = step.parentElement;
    container.remove();

    sortable_steps.option("disabled", steps_list.childElementCount <= 1);
  }

  if (steps_list.classList.contains("validate")) {
    validateSteps();
  }
}

// Cooking time
const cookingTimeDiv = document.getElementById("cookingtime");
const cookingTimeInput = document.getElementById("cookingtimeInput");

cookingTimeDiv.addEventListener("input", () => {
  const hours = Number(cookingTimeDiv.querySelector("#h").value);
  const minutes = Number(cookingTimeDiv.querySelector("#m").value);
  
  const totalTime = hours * 60 + minutes;
  cookingTimeInput.value = totalTime;

  if (cookingTimeDiv.classList.contains("validate")) {
    validateCookingTime();
  }
});


// Validation
function validateIngredients() {
  const ingredients = ingredients_list.children;

  let empty = true;
  for (let i = 0; i < ingredients.length && empty; ++i) {
    const ingredient = ingredients[i];

    if (ingredient
      .querySelector('input[name="ingredient[]"]')
      .value.length > 0) {

      empty = false;
    }
  }

  const valid = !empty;
  if (valid) {
    ingredients_list.classList.remove("invalid");
  } else {
    ingredients_list.classList.add("invalid");
  }

  return valid;
}

function validateSteps() {
  const types = Array.from(steps_list.children).map(getStepType);
      
  let foundOne = false;
  let emptySection = false;

  for (let i = 0; i < types.length; ++i) {
    const type = types[i];

    if (type === 0) foundOne = true;

    if (emptySection) {
      if (type === 1) return false;

      if (type === 0) emptySection = false;
    } else if (type === 1) {
      emptySection = true;
    }
  }

  const validFields = steps_list.querySelector(":invalid") === null;

  const valid = foundOne && !emptySection && validFields;
  
  if (valid) {
    steps_list.classList.remove("invalid");
  } else {
    steps_list.classList.add("invalid");
  }

  return valid;
}

function validateCookingTime() {
  const valid = cookingTimeDiv.querySelectorAll(":invalid").length === 0;
  if (valid) {
    cookingTimeDiv.classList.remove("invalid");
  } else {
    cookingTimeDiv.classList.add("invalid");
  }

  return valid;
}

function validate() {

  // Remove empty ingredients, always keeping one
  const ingredients = ingredients_list.children;
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
  ingredients_list.classList.add("validate");
  steps_list.classList.add("validate");
  cookingTimeDiv.classList.add("validate");
  tags_container.classList.add("validate")

  // Validate
  const toValidate = [
    (document.querySelectorAll(".validate:invalid").length === 0),
    validateIngredients(),
    validateSteps(),
    validateCookingTime()
  ];

  const isValid = toValidate.every(e => e);


  // Give user feedback
  if (!isValid) {
    dismissAlert(document.getElementById("incorrect-form-alert"));
    addAlert("Revise los campos del formulario que no son correctos e inténtelo de nuevo.", {
      type: "warning",
      scrollback: true,
      id: "incorrect-form-alert"
    });
  }

  ingredients_list.addEventListener("change", validateIngredients);
  steps_list.addEventListener("change", validateSteps);
  
  return isValid;
}


// Autocomplete
let tagFetchController = new AbortController();

function tagHinter(event) {
  const input = event.target;
  const list = document.getElementById("tag-datalist");

  const minCharacters = 2;

  if (input.value.length >= minCharacters) {
    
    tagFetchController.abort();
    tagFetchController = new AbortController();
    
    const query = new URLSearchParams({
      name: input.value,
      limit: 5
    });

    fetch(`/api/autocomplete/tag?${query}`, {
      signal: tagFetchController.signal
    })
      .then(response => response.json())
      .then(response => {
        list.innerHTML = "";
    
        response.tags.forEach(tag => {
          const option = document.createElement("option");
          option.value = tag;
    
          list.appendChild(option);
        });
      })
      .catch(err => {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          console.error(err);
        }
      });
  }
}

tags_user_input.addEventListener("input", tagHinter);
