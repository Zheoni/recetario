SELECT rt.name, t.es, t.en FROM RECIPE_TYPES rt
LEFT JOIN TRANSLATIONS t ON rt.translation = t.id
ORDER BY rt.number ASC;
