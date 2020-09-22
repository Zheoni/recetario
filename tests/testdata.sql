INSERT INTO RECIPES (id, name, author, description, image, type, cookingTime, servings, CREATED_AT, UPDATED_AT) VALUES (1, 'Receta 1', 'Autor 1', 'Una corta descripción sobre la receta 1', 'arroz.jpg', 1, 20, null, '2020-07-31 20:54:00', '2020-07-31 20:54:00');
INSERT INTO RECIPES (id, name, author, description, image, type, cookingTime, servings, CREATED_AT, UPDATED_AT) VALUES (2, 'Sopa asiática de arroz y tomate', 'Juan Pedro', 'La sopita de Juan Pedro. Saladita, rica, no muy nutritiva, pero hecha con cariño, eso siempre, no hay que dudar de Juan Pedro.', 'sopa.jpg', 2, 30, 2, '2020-07-31 21:00:47', '2020-07-31 21:10:39');

INSERT INTO INGREDIENTS (id, name) VALUES (1, 'arroz');
INSERT INTO INGREDIENTS (id, name) VALUES (2, 'sal');
INSERT INTO INGREDIENTS (id, name) VALUES (3, 'tomates');
INSERT INTO INGREDIENTS (id, name) VALUES (4, 'agua');
INSERT INTO INGREDIENTS (id, name) VALUES (5, 'salsa de soja');

INSERT INTO RECIPE_INGREDIENTS (recipe, ingredient, amount, unit, sort) VALUES (1, 1, 350.0, 'g', 3);
INSERT INTO RECIPE_INGREDIENTS (recipe, ingredient, amount, unit, sort) VALUES (1, 2, 1.0, 'pizca', 4);
INSERT INTO RECIPE_INGREDIENTS (recipe, ingredient, amount, unit, sort) VALUES (1, 3, 1.5, 'kg', 1);
INSERT INTO RECIPE_INGREDIENTS (recipe, ingredient, amount, unit, sort) VALUES (1, 4, 1.25, 'l', 2);
INSERT INTO RECIPE_INGREDIENTS (recipe, ingredient, amount, unit, sort) VALUES (2, 4, 1.0, 'l', 0);
INSERT INTO RECIPE_INGREDIENTS (recipe, ingredient, amount, unit, sort) VALUES (2, 3, 2.0, '', 1);
INSERT INTO RECIPE_INGREDIENTS (recipe, ingredient, amount, unit, sort) VALUES (2, 1, 150.0, 'g', 2);
INSERT INTO RECIPE_INGREDIENTS (recipe, ingredient, amount, unit, sort) VALUES (2, 5, 300.0, 'ml', 3);

INSERT INTO STEPS (id, recipe, type, content, sort) VALUES (1, 1, 1, 'Primera parte', 0);
INSERT INTO STEPS (id, recipe, type, content, sort) VALUES (2, 1, 0, 'El primer paso de la receta es muy sencillo.', 1);
INSERT INTO STEPS (id, recipe, type, content, sort) VALUES (3, 1, 0, 'El segundo paso es algo más complicado pero siguiendo las instrucciones se puede hacer sin problemas.', 2);
INSERT INTO STEPS (id, recipe, type, content, sort) VALUES (4, 1, 2, 'También leer las notas puede ser útil.', 3);
INSERT INTO STEPS (id, recipe, type, content, sort) VALUES (5, 1, 1, 'La salsa', 4);
INSERT INTO STEPS (id, recipe, type, content, sort) VALUES (6, 1, 0, 'La salsa es importante que esté caliente y por ello se hace al final. Preparamos los ingredientes y los ponemos todos en orden.', 5);
INSERT INTO STEPS (id, recipe, type, content, sort) VALUES (7, 1, 0, 'Luego los añadimos todos a la vez y calentamos.', 6);
INSERT INTO STEPS (id, recipe, type, content, sort) VALUES (8, 1, 0, 'Finalmente lo echamos todo en un plato y pa'' lante''.', 7);
INSERT INTO STEPS (id, recipe, type, content, sort) VALUES (9, 2, 0, 'Poner el agua a hervir.', 0);
INSERT INTO STEPS (id, recipe, type, content, sort) VALUES (10, 2, 0, 'Cuando esté hirviendo, echar el arroz y esperar 15 minutos a que se cueza.', 1);
INSERT INTO STEPS (id, recipe, type, content, sort) VALUES (11, 2, 0, 'Sacar el arroz y cocer los tomates 1 minuto en el agua del arroz. Sarlos y ponerlos bajo agua fría pasado el minuto para cortar la cocción.', 2);
INSERT INTO STEPS (id, recipe, type, content, sort) VALUES (12, 2, 2, 'Es importante hacer esto con los tomates para que mantengan su sabor pero la piel prácticamente se caiga.', 3);
INSERT INTO STEPS (id, recipe, type, content, sort) VALUES (13, 2, 0, 'Pelar los tomates en el agua fría y cortarlos/deshacerlos.', 4);
INSERT INTO STEPS (id, recipe, type, content, sort) VALUES (14, 2, 1, 'Montaje del plato', 5);
INSERT INTO STEPS (id, recipe, type, content, sort) VALUES (15, 2, 0, 'En un cuenco, echar el arroz y el tomate y mezclarlos.', 6);
INSERT INTO STEPS (id, recipe, type, content, sort) VALUES (16, 2, 0, 'Justo antes de comer, bañar con la salsa de soja.', 7);

INSERT INTO TAGS (id, name) VALUES (1, 'carne');
INSERT INTO TAGS (id, name) VALUES (2, 'rápido');
INSERT INTO TAGS (id, name) VALUES (4, 'compartir');
INSERT INTO TAGS (id, name) VALUES (5, 'rico');
INSERT INTO TAGS (id, name) VALUES (6, 'barato');
INSERT INTO TAGS (id, name) VALUES (7, 'de-juan-pedro');

INSERT INTO RECIPE_TAGS (recipe, tag) VALUES (1, 1);
INSERT INTO RECIPE_TAGS (recipe, tag) VALUES (1, 2);
INSERT INTO RECIPE_TAGS (recipe, tag) VALUES (1, 4);
INSERT INTO RECIPE_TAGS (recipe, tag) VALUES (2, 6);
INSERT INTO RECIPE_TAGS (recipe, tag) VALUES (2, 7);
INSERT INTO RECIPE_TAGS (recipe, tag) VALUES (2, 5);
