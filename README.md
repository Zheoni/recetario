# 🍗 Recetario

Web app project for personal use (or anyone to host it and use it by their own).

The idea behind is just to host it in my local network and have a web app to store recipes
in my house. Therefore, for the moment, no authentication or sophisticated security is
currently in mind.

## List of features

> ⚠️ some of them are still work in progress

- A place to store recipes in a safe easy way.
- Intuitive interface with support for mobile and desktop.
- View recipes in cook mode (step by step) and read mode.
- Automatic unit conversion.
- Search recipes by name, type, ingredients, and user tags.
- Export recipes to PDF.
- Export and import recipes in JSON format.

## What have I learned

**This is my first web app project**, thus I did not want to use any sophisticated framework like React, Angular or anything like that neither Bootstrap for the CSS. In the process of making this web app I have learned:

- [x] HTML5 markup. (Remember, first web app)
- [x] CSS3 styling. (Remember, first web app)
- [x] Javascript on the browser.
- [x] Building a responsive web app being able to use it comfortably in smaller screens.
- [x] Building a web server with Express
- [x] Server side rendering with EJS.
- [x] Managing a relational database for a web server with no ORM.
- [x] Basic usage of HTTP cookies.

## How to run it

```sh
git clone --recursive https://github.com/Zheoni/recetario
npm install
npm run initDatabase
npm start
```

This will start the server. By default it will listen on port 3000, it can be changed in the `.env` file.

### Environment variables

- `PORT` port the HTTP server will listen to. *Default: 3000*
- `DEFAULT_LOCALE` default language of the website. This can be any of the file names (without the extension) in the locales folder. *Default: en*
- `DATABASE_NAME` name of the database file. *Default: recipes.db*
- `DATABASE_DIR` path to the database directory where the database file is stored. *Default: .*
- `DEBUG` used to show debug messages. By default no messages are shown. To show some, I would set it to `recetario:*`. More on this [here](https://github.com/visionmedia/debug).
- `USE_LOGGER` whether to log all requests to the server or not. *Default: true*
- `USE_HELMET` whether to use [helmet](https://github.com/helmetjs/helmet) or not. *Default: false*
- `NODE_ENV` to use it, set it to `production`. More on this [here](https://expressjs.com/en/advanced/best-practice-performance.html#set-node_env-to-production).
- `HTTPS` can be "false", "true", "only". When set to "false", the app only creates 1 http server. When set to "true", the app creates 2 servers, one for http connections and other for https. When set to "only", the app only creates 1 https server. If it is set to "true" or "only", also requires that `HTTPS_CERT` and `HTTPS_KEY` are present as environment variables. *Default: false*
- `HTTPS_CERT` is the path to the file where the certificate is stored.
- `HTTPS_KEY` is the path to the file where the key is stored.
- `HTTPS_PASSPHRASE` is the passphrase for the key.
- `HTTPS_PORT` port the HTTPS server will listen to. *Default: 3001*
- `DEFAULT_IMAGE` a default image name used when a recipe has no image. The name has to be the file name of an image inside `public/recipes/images/`. *Default: undefined*

### npm scripts

- `npm run initDatabase` will initialize the SQLite database if it does not exist. It will create all the tables.
- `npm run forceInitDatabase` will do the same as `initDatabase` but if the database file exists it will overwrite it.
- `npm run addString` is a script for development that will add a new string to all the locale files, asking for input for each translation.

## Run it with Docker 🐳

I also included simple Dockerfile to build an image.

Two ports will be exposed the port 80 for HTTP and 443 for HTTPS.

The container will use two volumes:

- `/data/database` where the database file will be stored.
- `/data/images` where the recipe images will be store.

> ⚠️ `/data/database` contains the initialized database, so be careful if you use a bind mount.

When building the image, the `NODE_ENV` environment variable will be ignored and set to `production`. To change this, a the `NODE_ENV` build argument can be used.

Also, `PORT`, `HTTPS_PORT` and `DATABASE_DIR` environment variables will be ignored. All the other environment variables will be taken when you build the image from the `.env` file.

Example commands to build and run the image using the `recetario_database` and `recetario_images` volumes:

```sh
docker build -t zheoni/recetario .

docker run \
    -v recetario_database:/data/database \
    -v recetario_images:/data/images \
    -p 80:80 \
    --restart unless-stopped \
    -d \
    --name recetario-server \
    zheoni/recetario
```

## Dependencies

- All listed in `package.json`.
- [SortableJS](https://github.com/SortableJS/Sortable) (minified in vendor directory)
- [Boxicons](https://github.com/atisawd/boxicons) (in vendor directory)
