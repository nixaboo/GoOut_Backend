FROM node:11.13.0-alpine

WORKDIR /GoOut_Backend

RUN npm install -g nodemon@1.11.0

EXPOSE 5858


CMD npm start --verbose

