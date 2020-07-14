FROM node:12 AS node_base
FROM rclone/rclone

COPY package.json /
COPY package-lock.json /
COPY --from=node_base . .
RUN npm i
COPY . /

RUN mkdir /files
CMD npm start