FROM node:20-slim

WORKDIR /app

COPY package.json ./
RUN npm install

COPY server.js ./server.js
COPY src ./src

EXPOSE 5000

CMD ["node", "server.js"]

