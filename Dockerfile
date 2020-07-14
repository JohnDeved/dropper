FROM node:12
FROM rclone/rclone

COPY package.json /
COPY package-lock.json /
RUN npm i
COPY . /

RUN mkdir /files
CMD npm start