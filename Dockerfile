FROM node:12

COPY package.json /
COPY package-lock.json /
COPY rclone /
RUN npm i
COPY . /

RUN mkdir ./files

ENV NODE_ENV=production
CMD npm start