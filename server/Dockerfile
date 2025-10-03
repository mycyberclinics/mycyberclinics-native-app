FROM node:20.16-alpine3.19
LABEL authors="johnelwoods"

WORKDIR /app

COPY ./package*.json ./
RUN npm install

COPY ./ ./
RUN npm run build

CMD ["node", "src/index.js"]