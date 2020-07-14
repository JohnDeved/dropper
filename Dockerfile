FROM node:12
FROM rclone/rclone

COPY package.json /
COPY package-lock.json /
RUN rclone
RUN npm i
COPY . /

RUN mkdir /files
CMD npm start