INSERT INTO RECIPE_INGREDIENTS (recipe, ingredient, amount, unit, sort) 
VALUES
($recipe, 
(SELECT id FROM INGREDIENTS WHERE name = $ingredient),
$amount,
$unit,
$sort);
