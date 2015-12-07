var db = require('./db')
var _ = require('lodash')

exports.getSettings = function (callback) {
  db.getSettings(function (err, data) {
    data = data[0]

    data.pointsPerClearedRow += _.random(-2, 2)
    data.rowMultipler += _.random(-2, 2)
    data.dLinesCleared += _.random(-2, 2)
    data.multiplier += _.random(-2, 2)
    data.sideEdges += _.random(-2, 2)
    data.topEdges += _.random(-2, 2)
    data.blockedSpaces += _.random(-2, 2)
    data.heightWaigt += _.random(-2, 2)
    data.pointMultiplier += _.random(-2, 2)

    callback(err, data)
  })
}

exports.getBestEvaluations = function (callback) {
  db.getBestEvaluations(function (err, data) {
    var evolutionFocus = 10
    var played = _.takeRight(_.sortBy(data.gamesPlayed, 'Fitness'), evolutionFocus)
    var evolutionFitness = Math.ceil(_.sum(played, 'Fitness') / played.length)

      var fitness = _.every(_.pluck(played, 'Fitness'), function (n) {
        return n > data.evolutionFitness
      })

    if (!fitness) {
        console.log('Top: ' + _.pluck(played, 'Fitness'))
        console.log('Top avg evolutionFitness: ' + evolutionFitness + ' | old avg evolutionFitness: ' + data.evolutionFitness)
        console.log('Auto Evolution Postponed')
        return
    }

    var next = {
      pointsPerClearedRow: 0,
      rowMultipler: 0,
      dLinesCleared: 0,
      multiplier: 0,
      sideEdges: 0,
      topEdges: 0,
      blockedSpaces: 0,
      heightWaigt: 0,
      pointMultiplier: 0,
      evolutionNumber: data.evolutionNumber + 1,
      previousBestFitness: Math.ceil(_.sum(data.gamesPlayed, 'Fitness') / data.gamesPlayed.length),
      gamesPlayed: [],
      active: true,
      evolutionFitness: evolutionFitness
    }

    next.rowMultipler = Math.ceil(_.sum(played, 'AiSetting.rowMultipler') / played.length)
    next.dLinesCleared = Math.ceil(_.sum(played, 'AiSetting.dLinesCleared') / played.length)
    next.multiplier = Math.ceil(_.sum(played, 'AiSetting.multiplier') / played.length)
    next.sideEdges = Math.ceil(_.sum(played, 'AiSetting.sideEdges') / played.length)
    next.topEdges = Math.ceil(_.sum(played, 'AiSetting.topEdges') / played.length)
    next.blockedSpaces = Math.ceil(_.sum(played, 'AiSetting.blockedSpaces') / played.length)
    next.heightWaigt = Math.ceil(_.sum(played, 'AiSetting.heightWaigt') / played.length)
    next.pointMultiplier = Math.ceil(_.sum(played, 'AiSetting.pointMultiplier') / played.length)

    db.saveEvolution(next, callback)
  })
}

setInterval(function () {
  db.getBestEvaluations(function (err, data) {
    if (data.gamesPlayed.length > 150) {
      exports.getBestEvaluations(function (err, data) {
        console.log(data)
        console.log('Auto Evolution')
      })
    }
  })
}, 60 * 1000)
