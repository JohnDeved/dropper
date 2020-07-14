FROM node:12
FROM rclone/rclone AS rclone

COPY package.json /
COPY package-lock.json /
RUN npm i
COPY . /

RUN mkdir /files

COPY --from=node_base . .
CMD npm start