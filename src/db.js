var mongojs = require('mongojs')
var db = mongojs('tetris', ['evaluations'])

exports.getCurrentEvolution = function (callback) {
  db.evaluations.findOne({ active: true }, callback)
}

exports.getSettings = function (callback) {
  db.evaluations.findOne({ active: true }, { gamesPlayed: 0 }, callback)
}

exports.saveGameStatus = function (id, playStatus, callback) {
  db.evaluations.update({ _id: mongojs.ObjectId(id) }, {$addToSet: { gamesPlayed: playStatus }}, callback)
}

exports.saveEvolution = function (evaluation, callback) {
  db.evaluations.findAndModify({ query: { active: true },
    update: { $set: { active: false } },
    new: false }, function () {
    db.evaluations.insert(evaluation, callback)
  })
}

exports.newEvolution = function (data, callback) {
  db.evaluations.drop(function () {
    exports.saveEvolution({
      weights: data,
      evolutionNumber: 1,
      gamesPlayed: [],
      overallAvgFitness: 0,
      bestFitness: 0,
      evolutionFitness: 0,
      active: true
    }, callback)
  })
}
