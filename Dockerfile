FROM node:12

COPY package.json /
COPY package-lock.json /
RUN npm i
COPY . /

RUN mkdir /files
RUN https://rclone.org/install.sh | sudo bash

CMD npm start