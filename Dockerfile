FROM node:21.7.3-alpine3.19

WORKDIR /app

COPY package.json .
COPY package-lock.json .
COPY tsconfig.json .
COPY ecosystem.config.js .
COPY .env .
COPY ./src ./src
COPY ./openapi ./openapi

RUN apk update && apk add bash
RUN apk add python3
RUN npm install pm2 -g
RUN npm install
RUN npm run build

EXPOSE 4000

CMD ["pm2-runtime", "start", "ecosystem.config.js"]