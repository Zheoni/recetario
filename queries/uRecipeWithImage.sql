UPDATE RECIPES
SET name = $name,
author = $author,
description = $description,
image = $image,
type = $type,
cookingTime = $cookingTime,
servings = $servings
WHERE id = $id;
