CREATE TABLE RECIPE_TYPES(
	number		INTEGER PRIMARY KEY,
	name		TEXT NOT NULL
);

INSERT INTO RECIPE_TYPES (number, name) VALUES
(0, 'none'),
(1, 'starter'),
(2, 'main'),
(3, 'dessert');

CREATE TABLE STEP_TYPES(
	number		INTEGER PRIMARY KEY,
	name		TEXT NOT NULL
);

INSERT INTO STEP_TYPES (number, name) VALUES
(0, 'step'),
(1, 'section'),
(2, 'note');

CREATE TABLE RECIPES(
	-- need autoincrement because I cannot reuse ids when one is deleted
	id 			INTEGER PRIMARY KEY AUTOINCREMENT,
	name 		TEXT NOT NULL,
	author		TEXT,
	description	TEXT NOT NULL,
	image		TEXT,
	type		INTEGER NOT NULL,
	cookingTime	INTEGER	DEFAULT NULL,
	servings	INTEGER DEFAULT NULL,
	CREATED_AT	DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
	UPDATED_AT	DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY(type) REFERENCES RECIPE_TYPES(number)
		ON UPDATE CASCADE
);

CREATE TRIGGER update_timestamp_trigger
AFTER UPDATE ON RECIPES
FOR EACH ROW
WHEN OLD.UPDATED_AT = NEW.UPDATED_AT
BEGIN
	UPDATE RECIPES SET UPDATED_AT = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TABLE STEPS(
	id			INTEGER PRIMARY KEY,
	recipe		INTEGER NOT NULL,
	type		INTEGER NOT NULL,
	content		TEXT NOT NULL,
	sort		INTEGER DEFAULT NULL,
	FOREIGN KEY(recipe) REFERENCES RECIPES(id)
		ON DELETE CASCADE ON UPDATE CASCADE,
	FOREIGN KEY(type) REFERENCES STEP_TYPES(number)
);

CREATE TABLE INGREDIENTS(
	-- with no autoincrement, keys may be reused, but for this case its fine
	id			INTEGER PRIMARY KEY,
	name		TEXT NOT NULL UNIQUE
);

CREATE TABLE RECIPE_INGREDIENTS(
	recipe		INTEGER NOT NULL,
	ingredient	INTEGER NOT NULL,
	amount		REAL,
	unit		TEXT,
	sort		INTEGER DEFAULT NULL,
	FOREIGN KEY(recipe) REFERENCES RECIPES(id)
		ON DELETE CASCADE ON UPDATE CASCADE,
	FOREIGN KEY(ingredient) REFERENCES INGREDIENTS(id)
		ON UPDATE CASCADE
);

CREATE TABLE TAGS(
	id			INTEGER PRIMARY KEY,
	name		TEXT NOT NULL UNIQUE
);

CREATE TABLE RECIPE_TAGS(
	recipe		INTEGER NOT NULL,
	tag			INTEGER	NOT NULL,
	FOREIGN KEY(recipe) REFERENCES RECIPES(id)
		ON DELETE CASCADE ON UPDATE CASCADE,
	FOREIGN KEY(tag) REFERENCES TAGS(id)
		ON UPDATE CASCADE,
	UNIQUE(recipe, tag)
);

CREATE TABLE QUANTITIES(
	id			INTEGER PRIMARY KEY,
	name		TEXT NOT NULL UNIQUE
);

INSERT INTO QUANTITIES (id, name) VALUES
(1, 'mass'),
(2, 'length'),
(3, 'temperature'),
(4, 'volume');

CREATE TABLE UNIT_SYSTEMS(
	id			INTEGER PRIMARY KEY,
	name		TEXT NOT NULL UNIQUE
);

INSERT INTO UNIT_SYSTEMS (id, name) VALUES
(1, 'metric'),
(2, 'imperial');

CREATE TABLE UNITS(
	id			INTEGER PRIMARY KEY,
	name		TEXT NOT NULL UNIQUE,
	quantity	INTEGER NOT NULL,
	unitSystem	INTEGER,
	FOREIGN KEY(quantity) REFERENCES QUANTITIES(id),
	FOREIGN KEY(unitSystem) REFERENCES UNIT_SYSTEMS(id)
);

INSERT INTO UNITS (id, name, quantity, unitSystem) VALUES
-- mass
(1, 'kg', 1, 1),
(2, 'g', 1, 1),
(3, 'mg', 1, 1),
(4, 'lb', 1, 2),
(5, 'oz', 1, 2),
-- length
(6, 'm', 2, 1),
(7, 'cm', 2, 1),
(8, 'mm', 2, 1),
(9, 'in', 2, 2),
(10, 'ft', 2, 2),
(11, 'yd', 2, 2),
-- temperature
(12, '°C', 3, NULL),
(13, '°F', 3, NULL),
-- volume
(14, 'l', 4, 1),
(15, 'ml', 4, 1),
(16, 'dl', 4, 1),
(17, 'tsp.', 4, 2),
(18, 'tbsp.', 4, 2),
(19, 'fl oz', 4, 2),
(20, 'cup', 4, 2),
(21, 'pt', 4, 2),
(22, 'qt', 4, 2),
(23, 'gal', 4, 2);

CREATE TABLE UNIT_ALIASES(
	unit		INTEGER,
	alias		TEXT NOT NULL UNIQUE,
	locale		TEXT DEFAULT NULL,
	FOREIGN KEY(unit) REFERENCES UNITS(id)
);

INSERT INTO UNIT_ALIASES (unit, alias, locale) VALUES
(1, 'kilogram', 'en'),
(1, 'kilogramo', 'es'),
(2, 'gram', 'en'),
(2, 'gramo', 'es'),
(3, 'milligram', 'en'),
(3, 'miligramo', 'es'),
(4, 'pound', NULL),
(4, 'libra', 'es'),
(4, '#', 'en'),
(5, 'ounce', 'en'),
(5, 'onza', 'es'),

(6, 'metre', 'en'),
(6, 'meter', 'en'),
(6, 'metro', 'es'),
(7, 'centimetre', 'en'),
(7, 'centimeter', 'en'),
(7, 'centímetro', 'es'),
(8, 'millimetre', 'en'),
(8, 'millimeter', 'en'),
(8, 'milímetro', 'es'),
(9, 'inch', 'en'),
(9, 'inches', 'en'),
(9, 'pulgada', 'es'),
(9, '"', NULL),
(10, 'foot', 'en'),
(10, 'feet', 'en'),
(10, 'pie', 'es'),
(11, 'yard', 'en'),
(11, 'yarda', 'es'),

(12, 'C', NULL),
(12, 'ºC', NULL),
(12, 'Celsius', NULL),
(12, 'centigrades', 'en'),
(12, 'centígrados', 'es'),
(13, 'F', NULL),
(13, 'ºF', NULL),
(13, 'Fahrenheit', NULL),

(14, 'litre', 'en'),
(14, 'liter', 'en'),
(14, 'L', 'en'),
(14, 'litro', 'es'),
(15, 'millilitre', 'en'),
(15, 'milliliter', 'en'),
(15, 'mL', 'en'),
(15, 'mililitro', 'es'),
(16, 'decilitre', 'en'),
(16, 'deciliter', 'en'),
(16, 'dL', 'en'),
(16, 'decilitro', 'es'),
(17, 't', 'en'),
(17, 'tsp', 'en'),
(17, 'teaspoon', 'en'),
(17, 'cdta.', 'es'),
(17, 'cucharadita', 'es'),
(17, 'cucharilla', 'es'),
(18, 'T', 'en'),
(18, 'tbsp', 'en'),
(18, 'tbl.', 'en'),
(18, 'tbs.', 'en'),
(18, 'tablespoon', 'en'),
(18, 'cda.', 'es'),
(18, 'cucharada', 'es'),
(18, 'cuchara', 'es'),
(19, 'fl. oz.', NULL),
(19, 'fluid ounce', 'en'),
(19, 'onza líquida', 'es'),
(20, 'c', 'en'),
(20, 'taza', 'es'),
(21, 'p', 'en'),
(21, 'fl pt', 'en'),
(21, 'pint', 'en'),
(21, 'pinta', 'es'),
(22, 'q', 'en'),
(22, 'quart', 'en'),
(22, 'cuarto', 'es'),
(23, 'g', 'en'),
(23, 'gallon', 'en'),
(23, 'galón', 'es');

CREATE TABLE UNITS_CONVERSIONS(
	id			INTEGER PRIMARY KEY,
	unitFrom	INTEGER NOT NULL,
	unitTo		INTEGER NOT NULL,
	factor		REAL NOT NULL,
	verified	INTEGER NOT NULL DEFAULT FALSE,
	FOREIGN KEY(unitFrom) REFERENCES UNITS(id),
	FOREIGN KEY(unitTo) REFERENCES UNITS(id)
);

INSERT INTO UNITS_CONVERSIONS (unitFrom, unitTo, factor) VALUES
(1, 2, 1000), -- kg - g
(2, 3, 1000), -- g - mg
(4, 2, 453.592), -- lb - g
(5, 2, 28.3495), -- oz - g

(6, 7, 100), -- m - cm
(7, 8, 10), -- cm - mm
(6, 8, 1000), -- m - mm
(9, 7, 2.54), -- in - cm
(10, 7, 30.48), -- ft - cm
(11, 6, 0.9144), -- yd - m

(14, 15, 1000), -- l - ml
(14, 16, 10), -- l - dl
(17, 15, 5), -- tsp - ml
(18, 15, 15), -- tbsp - ml
(18, 17, 3), -- tbsp - tsp
(19, 15, 28.4130625), -- fl oz - ml
(20, 15, 250), -- cup - ml
(21, 15, 588), -- pt - ml
(22, 14, 1.1365225), -- qt - l
(22, 21, 2), -- qt - pt
(23, 14, 4.5461), -- gal - l
(23, 22, 4); -- gal - qt

UPDATE UNITS_CONVERSIONS SET verified = TRUE;

CREATE TABLE UNITS_LAST_UPDATE(
	name	TEXT PRIMARY KEY,
	time	NUMBER
);

INSERT INTO UNITS_LAST_UPDATE VALUES
('conversions', null),
('units', null),
('aliases', null);
