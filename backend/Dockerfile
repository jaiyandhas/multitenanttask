FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY server.js ./server.js
COPY src ./src

EXPOSE 5000

CMD ["node", "server.js"]

