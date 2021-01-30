// Tags input
const tags_containers = document.getElementsByClassName("tags-input-container");

const tag_regex = /^[0-9A-Za-zñáéíóúäëïöüàèìòùâêîôû\-\+]+$/;
const max_tag_length = 20;

function addTagToInput(tags_user_input, tags_input, tags_container, tagHinterList, tag_text) {
  if (tagHinterList)
    tagHinterList.innerHTML = "";

  let tag_content;
  if (tag_text) {
    tag_content = tag_text;
  } else {
    tag_content = tags_user_input.value;
    tags_user_input.value = "";
  }

  if (tag_regex.test(tag_content) === false || tag_content.length > max_tag_length) return;

  tag_content = tag_content.replace(",", "-");

  const current_tags = tags_input.value.split(",");

  if (tag_content.length > 0 && !current_tags.includes(tag_content)) {
    // Create the new tag div and add it to the document
    const new_tag_div = document.createElement("div");
    new_tag_div.classList.add("tag-view");
    new_tag_div.textContent = tag_content;
    new_tag_div.onclick = () => {
      removeTagFromInput(new_tag_div, tags_input, tags_container);
    }

    tags_container.insertBefore(new_tag_div, tags_user_input);

    // Add the tag to the input that will be sent
    if (tags_input.value.length === 0)
      tags_input.value = tag_content;
    else
      tags_input.value += "," + tag_content;
  }

  if (tags_container.classList.contains("validate") && validateTags) {
    validateTags();
  }
}

function removeTagFromInput(tag, tags_input, tags_container) {
  const tag_content = tag.textContent;
  tag.remove();
  tags_input.value = tags_input.value.replace(RegExp(tag_content + ",?"), "");
  tags_input.value = tags_input.value.replace(/,$/, "");

  if (tags_container.classList.contains("validate") && validateTags) {
    validateTags();
  }
}

function initializeTagContainer(tc, tagHinterList) {
  const tags_input = tc.querySelector(".tags-input");
  const tags_user_input = tc.querySelector(".tags-user-input");

  tags_user_input.addEventListener("input", (event) => {
    tagHinter(event, tags_input, tagHinterList);
  });

  tags_user_input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === "," || event.key === "Tab" || event.key === " ") {
      event.preventDefault();
      addTagToInput(tags_user_input, tags_input, tc, tagHinterList);
    } else if (event.key === "Backspace" && tags_user_input.value.length === 0) {
      event.preventDefault();
      const tag = tc.children[tc.childElementCount - 2];
      if (tag.classList.contains("tag-view")) {
        removeTagFromInput(tag, tags_input, tc);
      }
    }
  });
  
  tags_user_input.addEventListener("focusout", (event) => {
    event.preventDefault();
    if (tags_user_input.value.length > 0) {
      addTagToInput(tags_user_input, tags_input, tc, tagHinterList);
      tags_user_input.focus();
    }
  });
}

const tagHinterList = document.getElementById("tag-datalist");
for (let i = 0; i < tags_containers.length; ++i) {
  initializeTagContainer(tags_containers[i], tagHinterList);
}

// Autocomplete

let tagFetchController = new AbortController();
function tagHinter(event, tags_input, tagHinterList) {
  const input = event.target;

  const minCharacters = 2;

  if (input.value.length >= minCharacters) {
    
    if (tagFetchController)
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
        tagHinterList.innerHTML = "";
    
        response.tags.forEach(tag => {
          if (!tags_input.value.split(",").includes(tag)) {
            const option = document.createElement("option");
            option.value = tag;
      
            tagHinterList.appendChild(option);
          }
        });
      })
      .catch(err => {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          console.error(err);
        }
      });
  }
}

// Cooking time
const cookingTimeDivs = document.getElementsByClassName("cookingtime-container");

for (let i = 0; i < cookingTimeDivs.length; ++i) {
  const cookingTimeDiv = cookingTimeDivs[i];
  cookingTimeDiv.addEventListener("input", () => {
    const cookingTimeInput = cookingTimeDiv.querySelector("#cookingtimeInput");

    const hours = Number(cookingTimeDiv.querySelector("#h").value);
    const minutes = Number(cookingTimeDiv.querySelector("#m").value);
    
    const totalTime = hours * 60 + minutes;
    cookingTimeInput.value = totalTime;
  
    if (cookingTimeDiv.classList.contains("validate")) {
      validateCookingTime();
    }
  });
}
