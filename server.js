var express = require('express')
var app = express()
var cors = require('cors')
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
// app.use(require('morgan')('dev'))

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

  server.get('/evolution/settings', function (req, res) {
    learning.getSettings(function (error, data) {
      if (error) {
        throw new Error(error)
      }

      res.json(data)
    })
  })

  server.get('/evolution/best', function (req, res) {
    learning.getBestEvaluations(function (error, data) {
      if (error) {
        throw new Error(error)
      }

      res.json(data)
    })
  })

  server.post('/evolution/:id/result', function (req, res) {
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

  server.use(errorHandler)
}
