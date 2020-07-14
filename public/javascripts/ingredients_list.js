const list = document.getElementById("ingredients");
const template = list.children[list.childElementCount - 1].cloneNode(true);

let sortable = new Sortable(list, {
  handle: ".handle",
  animation: 200,
  touchStartThreshold: 3,
  disabled: true
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
