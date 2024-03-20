FROM oven/bun:1 as base

FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lockb /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# install with --production (exclude devDependencies)
RUN mkdir -p /temp/prod
COPY package.json bun.lockb /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

# copy node_modules from temp directory
# then copy all (non-ignored) project files into the image
FROM base AS prerelease
WORKDIR /app
COPY --from=install /temp/dev/node_modules node_modules
COPY . .
# Install app dependencies
# RUN mkdir -p /app

# COPY ./package.json /app/
# COPY ./.lock /app/
# RUN yarn install --frozen-lockfile
# Bundle app source

# COPY . /app

# RUN npm run build

EXPOSE 3000

ENV NODE_ENV production

CMD [ "bun", "serve" ]
