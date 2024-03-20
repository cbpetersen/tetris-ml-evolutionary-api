import * as _ from 'lodash'
import bodyParser from 'body-parser'
import cors from 'cors'
import * as db from './db'
import express from 'express'
import { Learning } from './learning'
import * as path from 'path'

import { Weights } from './types'
import http from 'http'

import * as settings from './settings.json'
const learning = new Learning(settings)

export const start = () => {
  const app = express()
  http.createServer(app).listen(3000, "0.0.0.0")
  console.log('Server running at http://localhost:3000/')
  const errorHandler = function(err, req, res, next) {
    console.log(err.stack)
    res.sendStatus(500)
  }

  const asyncMiddleware = fn =>
    (req, res, next) => {
      Promise.resolve(fn(req, res, next))
        .catch(next)
    }

  app.use(cors())
  app.use(bodyParser.json())
  app.use('/public', express.static('public'))
  // app.use(require('morgan')('dev'))

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

    server.get('/evolutions/:id/current', async (req, res) => {
      try {
        const data = await db.getCurrentEvolution(req.params.id)
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
      const data = await db.getEvolutions()
      res.json(data)
    })

    // server.get('/evolutions/:id/best', async (req, res) => {
    //   const data  = await learning.getBestEvaluations(req.params.id)
    //   res.json(data)
    // })

    const saveResultsInBulks = (() => {
      let buffer = {}
      let size = 0

      const emptyBuffer = (id, buffer) => {
        const keys = Object.keys(buffer)
        _.forEach(keys, x => {
          const saveData = db.saveMultipleGameStatuses(id, x, buffer[x])
        })
      }

      return async (id, gameData) => {
        delete gameData.name

        if (!buffer[gameData.weightsId]) {
          buffer[gameData.weightsId] = []
        }

        buffer[gameData.weightsId].push(gameData)
        size++

        if (size % 1 === 0) {
          emptyBuffer(id, buffer)
          buffer = {}
          size = 0
        }
      }
    })()

    server.post('/evolutions/:id/result', async (req, res) => {
      const id = req.params.id
      const gameData = req.body

      // console.log(gameData);

      await saveResultsInBulks(id, gameData)

      res.sendStatus(200)
    })

    server.post('/evolutions', async (req, res) => {
      if (!req.body) {
        throw new Error('payload missing')
      }

      console.log(req.headers);

      console.log(req.body);

      if (!_.isString(req.body.name)) {
        throw new Error('name is not a string')
      }

      if (!_.isObject(req.body.weights)) {
      }

      _.each(req.body.weights, function(value, key) {
        if (!_.isNumber(value)) {
          throw new Error(key + ': is not a number')
        }
      })

      const data = await learning.getOrCreateAlgorithm(req.body)
      res.json(data)
    })

    app.get('*', function(req, res) {
      res.sendStatus(404)
    })

    server.use(asyncMiddleware)
    server.use(errorHandler)
  }

  endpoints(app)
  learning.startBackgroundEvolutionTimer()
}
