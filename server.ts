import * as _ from 'lodash'
import * as bodyParser  from 'body-parser'
import * as cors  from 'cors'
import * as db from './src/db'
import * as express from 'express'
import * as learning from './src/learning'
import * as path from 'path'

const app = express()
require('http').createServer(app).listen(3000)

var errorHandler = function (err, req, res, next) {
  console.log(err.stack)
  res.sendStatus(500)
}

const asyncMiddleware = fn =>
(req, res, next) => {
  Promise.resolve(fn(req, res, next))
    .catch(next);
};

app.use(cors())
app.use(bodyParser.json())
app.use('/public', express.static('public'))
app.use(require('morgan')('dev'))

const endpoints = (server) => {
  server.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/index.html'))
  })

  server.get('/crossdomain.xml', (req, res) => {
    res.sendFile(path.join(__dirname, '/crossDomainPolicy.xml'))
  })

  server.get('/ping', (req, res) => {
    res.json({ ping: 'pong' })
  })

  server.get('/evolutions/:id/settings', async (req, res) => {
    try {
      const data = await learning.getSettings(req.params.id)
      if (!data) {
        res.sendStatus(404)
        return
      }

      res.json(data)
    } catch (error) {
      console.error(error)
      throw new Error(error)
    }
  })

  server.get('/evolutions', async (req, res) => {
    const data  = await db.getEvolutions()
    res.json(data)
  })

  server.get('/evolutions/:id/best', async (req, res) => {
    const data  = await learning.getBestEvaluations(req.params.id)
    res.json(data)
  })

  var saveResultsInBulks = (() => {
    var buffer = []
    var size = 0
    return async (id, gameData) => {
      delete gameData.name

      buffer.push(gameData)
      size++

      if (size % 50 === 0) {
        const saveData = await db.saveMultipleGameStatuses(id, buffer)

        buffer = []
        size = 0
      }
    }
  })()

  server.post('/evolutions/:id/result', async (req, res) => {
    var id = req.params.id
    var gameData = req.body

    await saveResultsInBulks(id, gameData)

    res.sendStatus(200)
  })

  server.post('/evolutions', async (req, res) => {
    if (!req.body) {
      throw new Error('payload missing')
    }

    if (!_.isString(req.body.name)) {
      throw new Error('name is not a string')
    }

    _.each(req.body.weights, function (value, key) {
      if (!_.isNumber(value)) {
        throw new Error(key + ': is not a number')
      }
    })

    const data = await learning.newAlgorithm(req.body)
    res.json(data)
  })

  app.get('*', function (req, res) {
    res.sendStatus(404)
  })

  server.use(asyncMiddleware)
  server.use(errorHandler)
}

endpoints(app)
