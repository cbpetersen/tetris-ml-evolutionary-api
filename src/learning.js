var db = require('./db')
var settings = require('./settings.json')
var _ = require('lodash')

exports.getSettings = function (callback) {
  db.getSettings(function (err, data) {
    data = data[0]

    data.linesCleared += _.random(-settings.newWeigtRandomDifference, settings.newWeigtRandomDifference)
    data.sideEdges += _.random(-settings.newWeigtRandomDifference, settings.newWeigtRandomDifference)
    data.topEdges += _.random(-settings.newWeigtRandomDifference, settings.newWeigtRandomDifference)
    data.blockedSpaces += _.random(-settings.newWeigtRandomDifference, settings.newWeigtRandomDifference)
    data.totalHeight += _.random(-settings.newWeigtRandomDifference, settings.newWeigtRandomDifference)

    callback(err, data)
  })
}

exports.getBestEvaluations = function (callback) {
  db.getCurrentEvolution(function (err, data) {
    if (err) {
      console.error(err)
      return
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
      linesCleared: 0,
      sideEdges: 0,
      topEdges: 0,
      blockedSpaces: 0,
      totalHeight: 0,
      evolutionNumber: data.evolutionNumber + 1,
      gamesPlayed: [],
      active: true,
      overallAvgFitness: overallAvgFitness,
      bestFitness: _.max(bestPerformingGames, 'Fitness'),
      evolutionFitness: evolutionFitness
    }

    next.linesCleared = Math.ceil(_.sum(bestPerformingGames, 'AiSetting.linesCleared') / bestPerformingGames.length)
    next.sideEdges = Math.ceil(_.sum(bestPerformingGames, 'AiSetting.sideEdges') / bestPerformingGames.length)
    next.topEdges = Math.ceil(_.sum(bestPerformingGames, 'AiSetting.topEdges') / bestPerformingGames.length)
    next.blockedSpaces = Math.ceil(_.sum(bestPerformingGames, 'AiSetting.blockedSpaces') / bestPerformingGames.length)
    next.totalHeight = Math.ceil(_.sum(bestPerformingGames, 'AiSetting.totalHeight') / bestPerformingGames.length)

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
