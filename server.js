var express = require('express')
var app = express()
var cors = require('cors')
var _ = require('lodash')
var db = require('./src/db')
var learning = require('./src/learning')
var bodyParser = require('body-parser')

require('http').createServer(app).listen(3000)

var errorHandler = function (err, req, res, next) {
  console.log(err.stack)
  res.sendStatus(500)
}

app.use(cors())
app.use(bodyParser.json())
app.use('/public', express.static('public'))
app.use(require('morgan')('dev'))

endpoints(app)

function endpoints (server) {
  server.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html')
  })

  server.get('/crossdomain.xml', function (req, res) {
    res.sendFile(__dirname + '/crossDomainPolicy.xml')
  })

  server.get('/ping', function (req, res) {
    res.json({ ping: 'pong' })
  })

  server.get('/evolutions/:id/settings', function (req, res) {
    learning.getSettings(req.params.id, function (error, data) {
      if (error) {
        throw new Error(error)
      }

      res.json(data)
    })
  })

  server.get('/evolutions', function (req, res) {
    db.getEvolutions(function (error, data) {
      if (error) {
        throw new Error(error)
      }

      res.json(data)
    })
  })

  server.get('/evolutions/:id/best', function (req, res) {
    learning.getBestEvaluations(req.params.id, function (error, data) {
      if (error) {
        throw new Error(error)
      }

      res.json(data)
    })
  })

  server.post('/evolutions/:id/result', function (req, res) {
    var id = req.params.id
    var gameData = req.body
    console.log(gameData.Fitness)
    db.saveGameStatus(id, gameData, function (error, data) {
      if (error) {
        throw new Error(error)
      }

      res.json(data)
    })
  })

  server.post('/evolutions', function (req, res) {
    if (!req.body) {
      throw new Error('payload missing')
    }

    if (!_.isString(req.body.name)) {
      throw new Error('name is not a string')
    }

    _.each(req.body.weights, function (value, key) {
      if (!_.isInteger(value)) {
        throw new Error(key + ': is not an integer')
      }
    })

    db.newEvolution(req.body, function (error, data) {
      if (error) {
        throw new Error(error)
      }

      res.json(data)
    })
  })

  server.use(errorHandler)
}
