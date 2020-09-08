const emojiImages = [];
const notLoadedImages = [];
const distinctImages = 3;
let usedImages = 0;
let imageIndex = 0;

const emojiOptions = {
  sepx: 45,
  sepy: 40,
  fontSize: 30,
  offset: 30
}

function generateImage(width, height) {
  const { data } = generateEmojiBackground(width, height, emojiOptions);
  return data;
}

function recipeCardNotLoaded(event) {
  const imageElement = event.target;
  imageElement.removeEventListener('error', recipeCardNotLoaded);
  notLoadedImages.push(imageElement);
  const width = imageElement.parentElement.clientWidth;
  const height = imageElement.parentElement.clientHeight;

  if (usedImages < distinctImages) {
    emojiImages.push(generateImage(width, height))
    ++usedImages;
  }

  const data = emojiImages[imageIndex++ % emojiImages.length];
  imageElement.src = data;
  imageElement.width = width;
  imageElement.height = height;
  


  let doit;
  window.onresize = () => {
    clearTimeout(doit);
    doit = setTimeout(resizedw, 500);
  };
}

function resizedw() {
  emojiImages.length = 0;
  const parent = document.querySelector(".card-image")
  const width = parent.clientWidth;
  const height = parent.clientHeight;
  for (let i = 0; i < usedImages; ++i) {
    emojiImages.push(generateImage(width, height));
  }

  let idx = 0;
  notLoadedImages.forEach(img => {
    img.src = emojiImages[idx++ % emojiImages.length];
    img.width = width;
    img.height = height;
  });
}

document.querySelectorAll('.card img').forEach(img => {
  if (img.naturalWidth === 0) {
    img.addEventListener('error', recipeCardNotLoaded);
    img.src = img.src;
  }
});
