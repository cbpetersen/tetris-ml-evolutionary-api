var db = require('./db')
var settings = require('./settings.json')
var _ = require('lodash')

exports.getSettings = function (id, callback) {
  db.getSettings(id, function (err, data) {
    if (err) {
      callback(err)
    }

    if (_.isEmpty(data.weights)) {
      callback(err, data)
    }

    _.forEach(data.weights, function (value, key) {
      data.weights[key] += _.random(-settings.newWeigtRandomDifference, settings.newWeigtRandomDifference)
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

    var bestPerformingGames = _.takeRight(_.sortBy(data.gamesPlayed, 'Fitness'), settings.bestPerformingGamesCount)
    var evolutionFitness = Math.ceil(_.sum(bestPerformingGames, 'Fitness') / bestPerformingGames.length)
    var overallAvgFitness = Math.ceil(_.sum(data.gamesPlayed, 'Fitness') / data.gamesPlayed.length)

    var aboveThreshold = _.every(_.map(bestPerformingGames, 'Fitness'), function (n) {
      return n > data.evolutionFitness
    })

    if (!aboveThreshold) {
      console.log('avg overallAvgFitness: ' + overallAvgFitness + ' | old avg overallAvgFitness: ' + data.overallAvgFitness)

      console.log('Top: ' + _.pluck(bestPerformingGames, 'fitness'))
      console.log('Top avg evolutionFitness: ' + evolutionFitness + ' | old avg evolutionFitness: ' + data.evolutionFitness)
      return
    }

    var weights
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

    _.each(bestPerformingGames[0].weights, function (value, key) {
      weights[key] = Math.ceil(_.sum(bestPerformingGames, key) / bestPerformingGames.length)
    })

    var next = {
      weights: weights,
      evolutionNumber: data.evolutionNumber,
      gamesPlayed: [],
      active: true,
      overallAvgFitness: overallAvgFitness,
      bestFitness: _.max(bestPerformingGames, 'fitness').fitness,
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
