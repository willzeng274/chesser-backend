FROM node:18.16.0-alpine3.17
RUN mkdir -p /opt/app
WORKDIR /opt/app
COPY package.json ./
RUN npm install
COPY . .
EXPOSE 8080
CMD [ "npm", "start" ]