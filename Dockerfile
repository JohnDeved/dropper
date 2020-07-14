FROM rclone/rclone AS rclone
FROM node:12

COPY package.json /
COPY package-lock.json /
RUN npm i
COPY . /

RUN mkdir /files

COPY --from=rclone . .
CMD npm start