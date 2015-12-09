var db = require('./db')
var _ = require('lodash')

exports.getSettings = function (callback) {
  db.getSettings(function (err, data) {
    data = data[0]

    data.linesCleared += _.random(-5, 5)
    data.sideEdges += _.random(-5, 5)
    data.topEdges += _.random(-5, 5)
    data.blockedSpaces += _.random(-5, 5)
    data.totalHeight += _.random(-5, 5)

    callback(err, data)
  })
}

exports.getBestEvaluations = function (callback) {
  db.getBestEvaluations(function (err, data) {
    if (err) {
      console.error(err)
      return
    }

    var evolutionFocus = 10
    var played = _.takeRight(_.sortBy(data.gamesPlayed, 'Fitness'), evolutionFocus)
    var evolutionFitness = Math.ceil(_.sum(played, 'Fitness') / played.length)

    var fitness = _.every(_.pluck(played, 'Fitness'), function (n) {
      return n > data.evolutionFitness
    })

    if (!fitness) {
      console.log('Top: ' + _.pluck(played, 'Fitness'))
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
      previousBestFitness: Math.ceil(_.sum(data.gamesPlayed, 'Fitness') / data.gamesPlayed.length),
      gamesPlayed: [],
      active: true,
      evolutionFitness: evolutionFitness
    }

    next.linesCleared = Math.ceil(_.sum(played, 'AiSetting.linesCleared') / played.length)
    next.sideEdges = Math.ceil(_.sum(played, 'AiSetting.sideEdges') / played.length)
    next.topEdges = Math.ceil(_.sum(played, 'AiSetting.topEdges') / played.length)
    next.blockedSpaces = Math.ceil(_.sum(played, 'AiSetting.blockedSpaces') / played.length)
    next.totalHeight = Math.ceil(_.sum(played, 'AiSetting.totalHeight') / played.length)

    db.saveEvolution(next, callback)
  })
}

setInterval(function () {
  db.getBestEvaluations(function (err, data) {
    if (err) {
      console.error(err)
      return
    }

    if (data.gamesPlayed.length > 150) {
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
}, 60 * 1000)
