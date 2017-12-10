import * as _ from 'lodash'

import { Algorithm, GameResult, NewAlgorithm } from './types'

// HACK:
const mongoist = require('mongoist')

const connect = () => {
  const dbHost = process.env.DB ? `${process.env.DB}/evolutionApi` : 'evolutionApi'
  return mongoist(dbHost, ['evaluations'])
}

const db = connect()

export const getCurrentEvolution = async (algorithmId: string): Promise<Algorithm> => {
  return await db.evaluations.findOne({ active: true, algorithmId: mongoist.ObjectId(algorithmId) })
}

export const getEvolutions = async (): Promise<Algorithm[]>  => {
  return await db.evaluations.find({ active: true }, { name: 1, algorithmId: 1, _id: 0 })
}

export const getEvolutionByName = async (name: string): Promise<Algorithm>  => {
  return await db.evaluations.findOne({ active: true, name: name }, { name: 1, algorithmId: 1, _id: 0 })
}

export const getSettings = async (algorithmId: string): Promise<Algorithm> => {
  return db.evaluations.findOne({ active: true, algorithmId: mongoist.ObjectId(algorithmId) }, { 'permutatedWeights.gameResults': 0 })
}

export const saveGameStatus = async (algorithmId: string, playStatus: any) => {
  return db.evaluations.update({ active: true, algorithmId: mongoist.ObjectId(algorithmId) }, { $push: { gamesPlayed: playStatus } })
}

export const deactivateWeights = async (algorithmId: string, permutatedWeightsIds: string[]) => {
  const ids = permutatedWeightsIds.map(x => {return mongoist.ObjectId(x)})
  return db.evaluations.update({algorithmId: mongoist.ObjectId(algorithmId), 'permutatedWeights': { $elemMatch: { 'id': {$in: ids}}}},
    {$set: {'permutatedWeights.$.active': false},
    $inc: {'activePermutations': -permutatedWeightsIds.length}})
}

export const saveMultipleGameStatuses = async (algorithmId: string, permutatedWeightsId, playStatuses: GameResult[]) => {
  return db.evaluations.update({algorithmId: mongoist.ObjectId(algorithmId), 'permutatedWeights.id': mongoist.ObjectId(permutatedWeightsId)},
    {$push: {'permutatedWeights.$.gameResults': { $each: playStatuses }},
      $inc: {'permutatedWeights.$.gamesPlayed': playStatuses.length, 'permutatedWeights.$.totalFitness': _.sumBy(playStatuses, x => x.fitness)}}
    )
}

export const saveReducedAlgorithm = async (algorithm: Algorithm) => {
  return db.evaluations.update({ query: { active: true, evolutionId: algorithm.algorithmId },
    update: algorithm})
}

export const saveNewEvolution = async (evaluation: Algorithm, oldEvolutionId: string) => {
  await db.evaluations.insert(evaluation)
  return db.evaluations.findAndModify({ query: { active: true, evolutionId: mongoist.ObjectId(oldEvolutionId) },
    update: { $set: { active: false } },
    new: false })
}

export const newAlgorithm = async (data: NewAlgorithm): Promise<Algorithm> => {
  const algorithm: Algorithm = {
    name: data.name,
    weights: data.weights,
    activePermutations: data.permutations.length,
    permutatedWeights: data.permutations,
    evolutionNumber: 1,
    evolutionId: mongoist.ObjectId(),
    overallAvgFitness: 0,
    bestFitness: 0,
    evolutionFitness: 0,
    algorithmId: mongoist.ObjectId(),
    active: true
  }

  return await db.evaluations.insert(algorithm)
}

export const createId = () => {
  return mongoist.ObjectId()
}
