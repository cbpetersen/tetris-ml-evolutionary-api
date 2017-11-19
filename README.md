# Tetris Machine learning Api

[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)
[![Build Status](https://travis-ci.org/cbpetersen/tetris-ml-evolutionary-api.svg?branch=master)](https://travis-ci.org/cbpetersen/tetris-ml-evolutionary-api)


## Machine learning api for distributed gamee agents

Let agents poll settings through a rest endpoint eg `localhost:3000/evolution/settings` which will then return the settings the agent should run games with.
When agents has completed a game the result can be submitted through a post to `localhost:3000/evolution/:evolutionId/result`
When enough games has been played the server will then evolve to the next evolution by evaluating the values of the best games in the previous evolution, and thereby incrementally improve on each evolution.

## To run the server

build and run with docker compose or just run `npm start` directly


## Dr Mario engines
[mono / .Net core engine terminal](https://github.com/cbpetersen/dr-mario-engine)

## Tetris engines
[mono / .Net core engine terminal](https://github.com/cbpetersen/tetris-engine)

[mono / .Net core engine unity 3d](https://github.com/cbpetersen/tetris-unity3d)
