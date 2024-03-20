import _ from 'lodash';

import { Algorithm, GameResult, NewAlgorithm } from './types'
import { ObjectId, MongoClient } from "mongodb";
import { randomUUID } from 'crypto';

const connect = () => {
  const dbHost = process.env.DB ? `${process.env.DB}/evolutionApi` : 'evolutionApi'
  const url = `mongodb://${process.env.DB}:27017`;
  const client = new MongoClient(url);
  client.connect();
  const db = client.db('evolutionApi');
  return db.collection<Algorithm>('evaluations');
}

const db = connect()

export const getCurrentEvolution = async (algorithmId: string): Promise<Algorithm> => {
  return await db.findOne({ active: true, algorithmId: algorithmId })
}

export const getEvolutions = async (): Promise<Algorithm[]> => {
  return await db.find({ active: true }, { projection: { 'name': 1, 'algorithmId': 1, '_id': 0 } }).toArray()
}

export const getEvolutionByName = async (name: string): Promise<Algorithm> => {
  return await db.findOne({ active: true, name: name }, { projection: { name: 1, algorithmId: 1, _id: 0 } })
}

export const getSettings = async (algorithmId: string): Promise<Algorithm> => {
  return db.findOne({ active: true, algorithmId: algorithmId }, { projection: { 'permutatedWeights.gameResults': 0 } })
}

export const saveGameStatus = async (algorithmId: string, playStatus: any) => {
  return db.updateOne({ active: true, algorithmId: algorithmId }, { $push: { gamesPlayed: playStatus } })
}

export const deactivateWeights = async (algorithmId: string, permutatedWeightsIds: string[]) => {
  return db.updateOne({ algorithmId: algorithmId, 'permutatedWeights': { $elemMatch: { 'id': { $in: permutatedWeightsIds } } } },
    {
      $set: { 'permutatedWeights.$.active': false },
      $inc: { 'activePermutations': -permutatedWeightsIds.length }
    })
}

export const saveMultipleGameStatuses = async (algorithmId: string, permutatedWeightsId, playStatuses: GameResult[]) => {
  return db.updateOne({ algorithmId: algorithmId, 'permutatedWeights.id': permutatedWeightsId },
    {
      $push: { 'permutatedWeights.$.gameResults': { $each: playStatuses } },
      $inc: { 'permutatedWeights.$.gamesPlayed': playStatuses.length, 'permutatedWeights.$.totalFitness': _.sumBy(playStatuses, x => x.fitness) }
    }
  )
}

export const saveReducedAlgorithm = async (algorithm: Algorithm) => {
  return db.updateOne({ active: true, evolutionId: algorithm.evolutionId }, { update: algorithm })
}

export const saveNewEvolution = async (evaluation: Algorithm, oldEvolutionId: string) => {
  await db.insertOne(evaluation)

  return db.updateOne({ active: true, evolutionId: oldEvolutionId }, {
    $set: { active: false },
  })
}

export const newAlgorithm = async (data: NewAlgorithm): Promise<Algorithm> => {
  const algorithm: Algorithm = {
    name: data.name,
    weights: data.weights,
    activePermutations: data.permutations.length,
    permutatedWeights: data.permutations,
    evolutionNumber: 1,
    evolutionId: createId(),
    overallAvgFitness: 0,
    bestFitness: 0,
    evolutionFitness: 0,
    algorithmId: createId(),
    active: true
  }

  await db.insertOne(algorithm)
  return algorithm
}

export const createId = () => {
  return randomUUID()
}
