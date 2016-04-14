var db = require('./db')
var settings = require('./settings.json')
var _ = require('lodash')

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

    _.forEach(data.weights, function (value, key) {
      data.weights[key] += _.random(-settings.newWeigtRandomDifference, settings.newWeigtRandomDifference, true)
    })

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
      avgWeights[key] = Math.ceil(_.sumBy(weights, key) / weights.length)
    })

    var next = {
      weights: avgWeights,
      name: data.name,
      evolutionNumber: data.evolutionNumber,
      gamesPlayed: [],
      active: true,
      overallAvgFitness: overallAvgFitness,
      bestFitness: _.maxBy(bestPerformingGames, 'fitness').fitness,
      evolutionFitness: evolutionFitness,
      algorithmId: data.algorithmId
    }

    db.saveEvolution(next, callback)
  })
}

setInterval(function () {
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

        if (data.gamesPlayed.length > settings.minGamesToEvaluate) {
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
}, settings.timeBetweenEvolutionCalculations)
