FROM node:12

COPY package.json /
COPY package-lock.json /
RUN npm i
COPY . /

RUN mkdir /files
RUN mkdir /tmp

CMD npm start