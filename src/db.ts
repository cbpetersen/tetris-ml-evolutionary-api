import * as mongoist from 'mongoist'
import * as mongojs from 'mongojs'

var dbHost = process.env.DB ? `${process.env.DB}/evolutionApi` : 'evolutionApi'
const db = mongoist(dbHost, ['evaluations'])

export const getCurrentEvolution = async function (algorithmId: string): Promise<EApi.Algorithm> {
  return await db.evaluations.findOne({ active: true, algorithmId: mongojs.ObjectId(algorithmId) })
}

export const getEvolutions = async function(): Promise<EApi.Algorithm[]>  {
  return await db.evaluations.find({ active: true }, { name: 1, algorithmId: 1, _id: 0 })
}

export const getSettings = async (algorithmId: string) => {
  return db.evaluations.findOne({ active: true, algorithmId: mongojs.ObjectId(algorithmId) }, { gamesPlayed: 0 })
}

export const saveGameStatus = function (algorithmId: string, playStatus: any) {
  return db.evaluations.update({ active: true, algorithmId: mongojs.ObjectId(algorithmId) }, { $push: { gamesPlayed: playStatus } })
}

export const saveMultipleGameStatuses = async (algorithmId: string, playStatuses: any) => {
  return db.evaluations.update({ active: true, algorithmId: mongojs.ObjectId(algorithmId) }, { $push: { gamesPlayed: { $each: playStatuses } } })
}

export const saveEvolution = async (evaluation: EApi.Algorithm, oldEvolutionId: string) => {
  return db.evaluations.findAndModify({ query: { active: true, evolutionId: oldEvolutionId },
    update: { $set: { active: false } },
    new: false }, function () {
    db.evaluations.insert(evaluation)
  })
}

export const newEvolution = async (data: any): Promise<EApi.Algorithm> => {
  return await db.evaluations.insert({
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
  })
}

export const createId = () => {
  return mongojs.ObjectId()
}
