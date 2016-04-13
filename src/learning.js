var db = require('./db')
var settings = require('./settings.json')
var _ = require('lodash')

exports.getSettings = function (callback) {
  db.getSettings(function (err, data) {
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

exports.getBestEvaluations = function (callback) {
  db.getCurrentEvolution(function (err, data) {
    if (err) {
      console.error(err)
      callback(err)
    }

    var bestPerformingGames = _.takeRight(_.sortBy(data.gamesPlayed, 'Fitness'), settings.bestPerformingGamesCount)
    var evolutionFitness = Math.ceil(_.sum(bestPerformingGames, 'Fitness') / bestPerformingGames.length)
    var overallAvgFitness = Math.ceil(_.sum(data.gamesPlayed, 'Fitness') / data.gamesPlayed.length)

    var aboveThreshold = _.every(_.pluck(bestPerformingGames, 'Fitness'), function (n) {
      return n > data.evolutionFitness
    })

    if (!aboveThreshold) {
      console.log('avg overallAvgFitness: ' + overallAvgFitness + ' | old avg overallAvgFitness: ' + data.overallAvgFitness)

      console.log('Top: ' + _.pluck(bestPerformingGames, 'Fitness'))
      console.log('Top avg evolutionFitness: ' + evolutionFitness + ' | old avg evolutionFitness: ' + data.evolutionFitness)
      return
    }

    var next = {
      linesCleared: Math.ceil(_.sum(bestPerformingGames, 'AiSetting.linesCleared') / bestPerformingGames.length),
      sideEdges: Math.ceil(_.sum(bestPerformingGames, 'AiSetting.sideEdges') / bestPerformingGames.length),
      topEdges: Math.ceil(_.sum(bestPerformingGames, 'AiSetting.topEdges') / bestPerformingGames.length),
      blockedSpaces: Math.ceil(_.sum(bestPerformingGames, 'AiSetting.blockedSpaces') / bestPerformingGames.length),
      totalHeight: Math.ceil(_.sum(bestPerformingGames, 'AiSetting.totalHeight') / bestPerformingGames.length),
      evolutionNumber: data.evolutionNumber + 1,
      gamesPlayed: [],
      active: true,
      overallAvgFitness: overallAvgFitness,
      bestFitness: _.max(bestPerformingGames, 'Fitness').Fitness,
      evolutionFitness: evolutionFitness
    }

    db.saveEvolution(next, callback)
  })
}

setInterval(function () {
  db.getCurrentEvolution(function (err, data) {
    if (err) {
      console.error(err)
      return
    }

    if (data.gamesPlayed.length > settings.minGamesToEvaluate) {
      exports.getBestEvaluations(function (err, data) {
        if (err) {
          console.error(err)
          return
        }

        console.log(data)
        console.log('Evolution!!')
      })
    }
  })
}, settings.timeBetweenEvolutionCalculations)
