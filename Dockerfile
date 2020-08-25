FROM node:14

# Create app directory
WORKDIR /usr/src/recetario

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

RUN npm install
RUN npm initDatabase

# Bundle app source
COPY . .

# Set the ports
ENV PORT=80
ENV HTTPS_PORT=443
EXPOSE 80
EXPOSE 443

CMD [ "node", "bin/www" ]
