SELECT name FROM TAGS
WHERE name LIKE $name
ORDER BY name ASC LIMIT $limit;
