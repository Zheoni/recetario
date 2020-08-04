UPDATE RECIPES
SET name = $name,
author = $author,
description = $description,
image = $image,
type = $type
WHERE id = $id;
