SELECT t.name FROM RECIPE_TAGS rt
JOIN TAGS t ON t.id = rt.tag
WHERE rt.recipe = ?
ORDER BY t.name ASC;
