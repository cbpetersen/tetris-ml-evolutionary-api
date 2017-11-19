import * as mongoist from 'mongoist'
import * as mongojs from 'mongojs'

import { Algorithm, GameResult, NewAlgorithm } from './types'

console.log(mongoist)
console.log('real run')
console.log('real run2')
// console.log(mongojs)
const dbHost = process.env.DB ? `${process.env.DB}/evolutionApi` : 'evolutionApi'
const db = mongoist(dbHost, ['evaluations'])

export const getCurrentEvolution = async (algorithmId: string): Promise<Algorithm> => {
  return await db.evaluations.findOne({ active: true, algorithmId: mongojs.ObjectId(algorithmId) })
}

export const getEvolutions = async (): Promise<Algorithm[]>  => {
  return await db.evaluations.find({ active: true }, { name: 1, algorithmId: 1, _id: 0 })
}

export const getEvolutionByName = async (name: string): Promise<Algorithm>  => {
  return await db.evaluations.findOne({ active: true, name: name }, { name: 1, algorithmId: 1, _id: 0 })
}

export const getSettings = async (algorithmId: string) => {
  return db.evaluations.findOne({ active: true, algorithmId: mongojs.ObjectId(algorithmId) }, { gamesPlayed: 0 })
}

export const saveGameStatus = async (algorithmId: string, playStatus: any) => {
  return db.evaluations.update({ active: true, algorithmId: mongojs.ObjectId(algorithmId) }, { $push: { gamesPlayed: playStatus } })
}

export const saveMultipleGameStatuses = async (algorithmId: string, playStatuses: any) => {
  return db.evaluations.update({ active: true, algorithmId: mongojs.ObjectId(algorithmId) }, { $push: { gamesPlayed: { $each: playStatuses } } })
}

export const saveMultipleGameResults = async (algorithmId: string, gameResults: GameResult[]) => {
  return db.evaluations.update({ active: true, algorithmId: mongojs.ObjectId(algorithmId) }, { $push: { gamesPlayed: { $each: gameResults } } })
}

export const saveEvolution = async (evaluation: Algorithm, oldEvolutionId: string) => {
  return db.evaluations.findAndModify({ query: { active: true, evolutionId: oldEvolutionId },
    update: { $set: { active: false } },
    new: false }, () => {
    db.evaluations.insert(evaluation)
  })
}

export const newEvolution = async (data: NewAlgorithm): Promise<Algorithm> => {
  const algorithm: Algorithm = {
    name: data.name,
    weights: data.weights,
    permutatedWeights: data.permutations,
    evolutionNumber: 1,
    evolutionId: mongojs.ObjectId(),
    gamesPlayed: [],
    overallAvgFitness: 0,
    bestFitness: 0,
    evolutionFitness: 0,
    algorithmId: mongojs.ObjectId(),
    active: true
  }

  return await db.evaluations.insert(algorithm)
}

export const createId = () => {
  return mongojs.ObjectId()
}
