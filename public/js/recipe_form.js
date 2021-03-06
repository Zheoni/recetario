const imageButton = document.getElementById("chooseImageButton");
const imageInput = document.getElementById("image");
const imageName = document.getElementById("selected-image");
imageButton.addEventListener("click", () => imageInput.click());
imageInput.addEventListener("change", () => {
  imageName.textContent = imageInput.files[0].name;
});

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


// Validation
const tags_container = document.querySelector(".tags-input-container")
const tags_input = document.querySelector(".tags-input")
function validateTags() {
  let valid;
  if (tags_input.value.length === 0) {
    valid = true;
  } else {
    const tags = tags_input.value.split(",");
    console.log(tags, tags.length)
  
    valid = tags.length <= 5 && tags.every((tag) => tag_regex.test(tag));
  }
  if (valid) {
    tags_container.classList.remove("invalid");
  } else {
    tags_container.classList.add("invalid");
  }

  return valid;
}

function validateIngredients() {
  const ingredients = ingredients_list.children;

  let empty = false, unitNoValue = false;
  for (let i = 0; i < ingredients.length && !empty && !unitNoValue; ++i) {
    const ingredient = ingredients[i];

    if (ingredient.querySelector('input[name="ingredient[]"]')?.value.length <= 0) {
      empty = true;
    }

    // If unit is given but no value.
    if (ingredient.querySelector('input[name="unit[]"]')?.value.length > 0
      && ingredient.querySelector('input[name="amount[]"]')?.value.length <= 0) {
      unitNoValue = true;
    }
  }

  const valid = !empty && !unitNoValue;
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

const cookingTimeDiv = document.querySelector(".cookingtime-container");
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
    validateTags(),
    validateIngredients(),
    validateSteps(),
    validateCookingTime()
  ];

  const isValid = toValidate.every(e => e);


  // Give user feedback
  if (!isValid) {
    dismissAlert(document.getElementById("incorrect-form-alert"));
    addAlert(bundledLocales["alerts.reviewRecipeForm"], {
      type: "warning",
      scrollback: true,
      id: "incorrect-form-alert"
    });
  }

  ingredients_list.addEventListener("change", validateIngredients);
  steps_list.addEventListener("change", validateSteps);
  
  return isValid;
}


// Upload JSON

const jsonFilesElem = document.getElementById("JSONFiles"),
  uploadJSONButton = document.getElementById("uploadJSONFilesButton"),
  uploadModal = document.getElementById("uploadModal"),
  openJSONModalButton = document.getElementById("openJSONModalButton"),
  div1 = document.getElementById("modal-upload-form"),
  div2 = document.getElementById("modal-upload-results"),
  resultsListElement = document.getElementById("results-list"),
  resetModalButton = document.getElementById("resetModalButton"),
  templateSuccess = document.getElementById("correctResultTemplate"),
  templateError = document.getElementById("errorResultTemplate");

if (jsonFilesElem) {
  jsonFilesElem.addEventListener("change", handleFiles);

  function handleFiles() {
    const fileList = this.files;
    if (fileList.length <= 0) return;
  
    // Prevent the user from exit the modal while the files are loaded and sended.
    canCloseModal(uploadModal, false);
    uploadJSONButton.disabled = true;
    div1.style.display = "none";
    div2.style.display = "block";
  
    // Proccess the files
    for (let i = 0; i < fileList.length; ++i) {
      readAndUploadJSONFile(fileList[i]);
    }
  
    // Restore normal behaviour
    canCloseModal(uploadModal, true);
    resetModalButton.hidden = false;
  }
  
  function readAndUploadJSONFile(file) {
    const reader = new FileReader(file);
    reader.onload = async function (event) {
      const fileData = event.target.result;
      const [correct, responseData] = await uploadJSON(fileData);
      let element;
      if (correct) {
        element = templateSuccess.content.cloneNode(true);
        element.querySelector("a").href = `/recipe/${responseData.id}`;
      } else {
        element = templateError.content.cloneNode(true);
      }
      element.querySelector("span[name=fileName]").textContent = file.name;
      resultsListElement.appendChild(element);
    }
    reader.readAsText(file);
  }
  
  async function uploadJSON(data) {
    const response = await fetch("/api/recipe", {
      method: "POST",
      body: data,
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      }
    });
    const responseData = await response.json();
    return [response.ok, responseData];
  }
  
  uploadJSONButton.addEventListener("click", () => {
    if (jsonFilesElem) {
      jsonFilesElem.click();
    }
  });
  
  resetModalButton.addEventListener("click", () => {
    div2.style.display = "none";
    div1.style.display = "block";
    resultsListElement.innerHTML = "";
    jsonFilesElem.value = "";
    resetModalButton.hidden = true;
    uploadJSONButton.disabled = false;
  })
  
  openJSONModalButton.addEventListener("click", () => showModal(uploadModal));  
}
