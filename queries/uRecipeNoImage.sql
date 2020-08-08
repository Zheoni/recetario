UPDATE RECIPES
SET name = $name,
author = $author,
description = $description,
type = $type,
cookingTime = $cookingTime,
servings = $servings
WHERE id = $id;
