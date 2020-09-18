const emojiImages = [];
const distinctImages = 3;
let usedImages = 0;
let imageIndex = 0;

const emojiOptions = {
  initialy: 20,
  sepx: 20,
  sepy: 20,
  fontSize: 40,
  random: true
}

function recipeCardNotLoaded(event) {
  const imageElement = event.target;
  imageElement.removeEventListener('error', recipeCardNotLoaded);
  
  emojiOptions.width = imageElement.parentElement.clientWidth;
  emojiOptions.height = imageElement.parentElement.clientHeight;

  if (usedImages < distinctImages) {
    const charset = getRandomFoodEmojis(8);
    emojiImages.push(generateUnicodeImage(charset, emojiOptions));
    ++usedImages;
  }

  const data = emojiImages[imageIndex++ % emojiImages.length];
  imageElement.src = data;
  imageElement.width = emojiOptions.width;
  imageElement.height = emojiOptions.height;
}

document.querySelectorAll('.card img').forEach(img => {
  if (img.naturalWidth === 0) {
    img.addEventListener('error', recipeCardNotLoaded);
    img.src = img.src;
  }
});
