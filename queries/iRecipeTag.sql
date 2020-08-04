INSERT INTO RECIPE_TAGS (recipe, tag)
VALUES
($recipe_id,
(SELECT id FROM TAGS WHERE name = $tag));
