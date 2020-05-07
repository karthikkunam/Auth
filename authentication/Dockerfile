FROM node:12.13.0-alpine
LABEL maintainer="Srikanth.Mandala@7-11.com"
WORKDIR /opt/app
#RUN npm config set registry https://jfrog.devops.7-11.com/api/npm/npm/ && npm install
RUN apk update && apk add zip && apk add curl
COPY archive.zip /opt/app/
RUN unzip /opt/app/archive.zip && ls -la
COPY package.json ./
RUN npm config set @7eleven:registry=https://jfrog.devops.7-11.com/api/npm/npm/ && npm i
EXPOSE 3110
CMD ["node", "/opt/app/dist/server.js"]
