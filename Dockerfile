FROM node:latest AS node_base
FROM rclone/rclone
COPY --from=node_base . .

COPY package.json /
COPY package-lock.json /
RUN npm i
COPY . /

RUN mkdir /files
CMD npm start