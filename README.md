# tetris-ml-evolutionary-api
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)  

### Machine learning api for distributed tetris agents
Agents to poll settings through a rest endpoint eg `localhost:3000/evolution/settings` which will then return the settings the agent should run games with.
When agents has completed a game the result can be submitted through a post to `localhost:3000/evolution/:evolutionId/result`
When enough games has been played the server will then evolve to the next evolution by evaluating the values of the best games in the previous evolution, and thereby incrementally improve on each evolution.

### To run
run `node init.js` to set up mongodb collection with initial data.

after this the application can just be started with `node server.js`
