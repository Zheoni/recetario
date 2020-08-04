UPDATE RECIPES
SET name = $name,
author = $author,
description = $description,
type = $type
WHERE id = $id;
