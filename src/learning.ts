var db = require('./db')
var settings = require('./settings.json')
var _ = require('lodash')
var combinations = require('./combinations')

let preCalculatedWeights = {}
let preCalculatedWeightsPointer = {}

exports.newAlgorithm = (data, callback) => {
  db.getEvolutions((err, dbRsp) => {
    if (err) {
      callback(err)
      return
    }

    if (_.some(dbRsp, {name: data.name})) {
      let algorithm = _.first(dbRsp, {name: data.name})
      return exports.getSettings(algorithm.algorithmId, callback)
    }

    db.newEvolution(data, (err, dbRsp) => {
      if (err) {
        callback(err)
        return
      }

      dbRsp.weights = preCalculateWeights(dbRsp.algorithmId, dbRsp.evolutionNumber, dbRsp.weights)

      callback(err, dbRsp)
    })
  })
}

exports.getSettings = function (id, callback) {
  db.getSettings(id, function (err, data) {
    if (err) {
      callback(err)
      return
    }

    if (!data) {
      callback()
      return
    }

    if (_.isEmpty(data.weights)) {
      callback(err, data)
      return
    }

    data.weights = getCalculatedWeights(data.algorithmId, data.evolutionNumber, data.weights)

    callback(err, data)
  })
}

exports.getBestEvaluations = function (algorithmId, callback) {
  db.getCurrentEvolution(algorithmId, function (err, data) {
    if (err) {
      console.error(err)
      callback(err)
    }

    var bestPerformingGames = _.takeRight(_.sortBy(data.gamesPlayed, 'fitness'), settings.bestPerformingGamesCount)
    var evolutionFitness = Math.ceil(_.sumBy(bestPerformingGames, 'fitness') / bestPerformingGames.length)
    var overallAvgFitness = Math.ceil(_.sumBy(data.gamesPlayed, 'fitness') / data.gamesPlayed.length)

    var aboveThreshold = _.every(_.map(bestPerformingGames, 'fitness'), function (n) {
      return n > data.evolutionFitness
    })

    if (!aboveThreshold) {
      console.log('current evolution: ' + data.evolutionNumber)
      console.log('avg overallAvgFitness: ' + overallAvgFitness + ' | old avg overallAvgFitness: ' + data.overallAvgFitness)
      console.log('Top: ' + _.map(bestPerformingGames, 'fitness'))
      console.log('Top avg evolutionFitness: ' + evolutionFitness + ' | old avg evolutionFitness: ' + data.evolutionFitness)
      return
    }

    if (bestPerformingGames.length === 0) {
      callback(undefined, {
        weights: data.weights,
        evolutionNumber: data.evolutionNumber,
        gamesPlayed: [],
        active: true,
        overallAvgFitness: overallAvgFitness,
        bestFitness: 0,
        evolutionFitness: evolutionFitness,
        algorithmId: data.algorithmId,
        comment: 'No evolution perfomed'
      })
      return
    }

    var weights = _.map(bestPerformingGames, 'weights')
    var avgWeights = {}

    _.each(_.first(weights), function (value, key) {
      avgWeights[key] = _.sumBy(weights, key) / weights.length
    })

    var next = {
      weights: avgWeights,
      name: data.name,
      evolutionNumber: data.evolutionNumber + 1,
      evolutionId: db.createId(),
      gamesPlayed: [],
      active: true,
      overallAvgFitness: overallAvgFitness,
      bestFitness: _.maxBy(bestPerformingGames, 'fitness').fitness,
      evolutionFitness: evolutionFitness,
      algorithmId: data.algorithmId
    }

    preCalculateWeights(next.algorithmId, next.evolutionNumber, next.weights)

    console.dir(['next evolution', next], { depth: null, colors: true })
    db.saveEvolution(next, data.evolutionId, callback)
  })
}

const getCalculatedWeights = (algorithmId, evolutionNumber, weights) => {
  if (preCalculatedWeights[algorithmId]) {
    let newPointerValue = ++preCalculatedWeightsPointer[algorithmId]
    if (newPointerValue >= preCalculatedWeights[algorithmId].length) {
      newPointerValue = 0
      preCalculatedWeightsPointer[algorithmId] = 0
    }

    return preCalculatedWeights[algorithmId][newPointerValue]
  }

  return preCalculateWeights(algorithmId, evolutionNumber, weights)
}

const preCalculateWeights = (algorithmId, evolutionNumber, weights) => {
  let randomDiff = (settings.newWeigtRandomDifference - (Math.min(0.9, evolutionNumber * 0.1) * settings.newWeigtRandomDifference)) / settings.newWeigtRandomDifference
  preCalculatedWeights[algorithmId] = combinations.generateCombinations(weights, randomDiff)
  preCalculatedWeightsPointer[algorithmId] = 0

  return preCalculatedWeights[algorithmId][0]
}

function runEvolution () {
  db.getEvolutions(function (err, data) {
    if (err) {
      console.error(err)
      return
    }

    _.each(data, function (evolution) {
      db.getCurrentEvolution(evolution.algorithmId, function (err, data) {
        if (err) {
          console.error(err)
          return
        }

        console.log('Progress for ' + data.name + ' ' + data.gamesPlayed.length + '/' + settings.minGamesToEvaluate)
        if (preCalculatedWeights[data.algorithmId] && data.gamesPlayed.length > preCalculatedWeights[data.algorithmId].length) {
          exports.getBestEvaluations(evolution.algorithmId, function (err, data) {
            if (err) {
              console.error(err)
              return
            }

            console.log(data)
            console.log('Evolution!!')
          })
        }
      })
    })
  })
}

setInterval(runEvolution, settings.timeBetweenEvolutionCalculations)

runEvolution()
