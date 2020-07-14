FROM node:12 AS node

COPY package.json /
COPY package-lock.json /
COPY package-lock.json /
RUN npm i
COPY . /

RUN mkdir /files

FROM rclone/rclone
COPY rclone.conf /
RUN mkdir ./files
RUN rclone --config=/rclone.conf mount dropper: ./files

COPY --from=node . .
CMD npm start