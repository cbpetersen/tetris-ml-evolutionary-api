FROM mhart/alpine-node:latest

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
RUN npm i -g yarn

# Install app dependencies
COPY package.json /usr/src/app/
COPY yarn.lock /usr/src/app/
RUN yarn install
# Bundle app source

COPY . /usr/src/app

RUN npm run build

EXPOSE 3000

ENV NODE_ENV production

CMD [ "npm", "serve" ]
