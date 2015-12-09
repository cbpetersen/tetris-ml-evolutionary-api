var mongojs = require('mongojs')
var db = mongojs('tetris', ['evaluations'])

exports.getBestEvaluations = function (callback) {
  db.evaluations.findOne({ active: true }, callback)
}

exports.getSettings = function (callback) {
  db.evaluations.find({ active: true }, { gamesPlayed: 0 }).sort({ $natural: 1 }).limit(1, callback)
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
