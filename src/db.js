var mongojs = require('mongojs')
var dbHost = process.env.DB ? process.env.DB + '/tetris' : 'tetris'

var db = mongojs(dbHost, ['evaluations'])

exports.getCurrentEvolution = function (algorithmId, callback) {
  db.evaluations.findOne({ active: true, algorithmId: mongojs.ObjectId(algorithmId) }, callback)
}

exports.getEvolutions = function (callback) {
  db.evaluations.find({ active: true }, { name: 1, algorithmId: 1, _id: 0 }, callback)
}

exports.getSettings = function (algorithmId, callback) {
  db.evaluations.findOne({ algorithmId: mongojs.ObjectId(algorithmId) }, { gamesPlayed: 0 }, callback)
}

exports.saveGameStatus = function (algorithmId, playStatus, callback) {
  db.evaluations.update({ active: true, algorithmId: mongojs.ObjectId(algorithmId) }, {$addToSet: { gamesPlayed: playStatus }}, callback)
}

exports.saveEvolution = function (evaluation, callback) {
  db.evaluations.findAndModify({ query: { active: true, algorithmId: evaluation.algorithmId },
    update: { $set: { active: false } },
    new: false }, function () {
    db.evaluations.insert(evaluation, callback)
  })
}

exports.newEvolution = function (data, callback) {
  exports.saveEvolution({
    name: data.name,
    weights: data.weights,
    evolutionNumber: 1,
    gamesPlayed: [],
    overallAvgFitness: 0,
    bestFitness: 0,
    evolutionFitness: 0,
    algorithmId: mongojs.ObjectId(),
    active: true
  }, callback)
}
