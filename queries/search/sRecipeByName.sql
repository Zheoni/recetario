SELECT id, name FROM RECIPES
WHERE name LIKE $name
ORDER BY name ASC
LIMIT $limit;
