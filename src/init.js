var db = require('./db')
var mongojs = require('mongojs')
var mongodb = mongojs('tetris', ['evaluations'])

mongodb.evaluations.drop(function () {
  db.saveEvolution({
    weights: {
      linesCleared: 0,
      sideEdges: 0,
      topEdges: 0,
      blockedSpaces: 0,
      totalHeight: 0
    },
    evolutionNumber: 1,
    gamesPlayed: [],
    overallAvgFitness: 0,
    bestFitness: 0,
    evolutionFitness: 0,
    active: true
  }, function (error, data) {
    console.log(error)
    console.log(data)
    process.exit(0)
  })
})
