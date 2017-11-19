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
  db.evaluations.findOne({ active: true, algorithmId: mongojs.ObjectId(algorithmId) }, { gamesPlayed: 0 }, callback)
}

exports.saveGameStatus = function (algorithmId, playStatus, callback) {
  db.evaluations.update({ active: true, algorithmId: mongojs.ObjectId(algorithmId) }, { $push: { gamesPlayed: playStatus } }, callback)
}

exports.saveMultipleGameStatuses = function (algorithmId, playStatuses, callback) {
  db.evaluations.update({ active: true, algorithmId: mongojs.ObjectId(algorithmId) }, { $push: { gamesPlayed: { $each: playStatuses } } }, callback)
}

exports.saveEvolution = function (evaluation, oldEvolutionId, callback) {
  db.evaluations.findAndModify({ query: { active: true, evolutionId: oldEvolutionId },
    update: { $set: { active: false } },
    new: false }, function () {
    db.evaluations.insert(evaluation, callback)
  })
}

exports.newEvolution = function (data, callback) {
  db.evaluations.insert({
    name: data.name,
    weights: data.weights,
    evolutionNumber: 1.0,
    evolutionId: mongojs.ObjectId(),
    gamesPlayed: [],
    overallAvgFitness: 0,
    bestFitness: 0,
    evolutionFitness: 0,
    algorithmId: mongojs.ObjectId(),
    active: true
  }, callback)
}

exports.createId = () => {
  return mongojs.ObjectId()
}
