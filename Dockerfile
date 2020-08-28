FROM node:14

# Create app directory
WORKDIR /usr/src/recetario

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

RUN npm install

# Bundle app source
COPY . .

ENV DATABASE_DIR=/data/database
RUN npm run initDatabase
# Set the ports
ENV PORT=80
ENV HTTPS_PORT=443
EXPOSE 80
EXPOSE 443

RUN mkdir -p /data/images
RUN mkdir -p /usr/src/recetario/public/recipes/
RUN ln -s /data/images /usr/src/recetario/public/recipes/images 

VOLUME ["/data/database", "/data/images"]

ARG NODE_ENV
ENV NODE_ENV ${NODE_ENV:-production}
CMD [ "node", "bin/www" ]
