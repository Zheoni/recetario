SELECT recipe, amount, unit, name FROM RECIPE_INGREDIENTS ri
JOIN INGREDIENTS i ON ri.ingredient = i.id
WHERE ri.recipe = ?
ORDER BY ri.sort ASC;
