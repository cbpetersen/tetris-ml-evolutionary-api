FROM mhart/alpine-node:latest

RUN npm i -g yarn

# Install app dependencies
RUN mkdir -p /app
WORKDIR /app

COPY ./package.json /app/
COPY ./yarn.lock /app/
RUN yarn install --frozen-lockfile
# Bundle app source

COPY . /app

RUN npm run build

EXPOSE 3000

ENV NODE_ENV production

CMD [ "npm", "serve" ]
