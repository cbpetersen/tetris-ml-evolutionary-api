import * as _ from 'lodash'
import * as combinations from './combinations'
import * as db from './db'

import {
  Algorithm,
  Dictionary,
  GameResult,
  GetAlgorithm,
  NewAlgorithm,
  Settings,
  WeightPermutation,
  Weights,
} from './types'

import { getEvolutions } from './db'

const settings: Settings = require('./settings.json')

const preCalculatedWeights: Dictionary<Weights[]> = {}
const preCalculatedWeightsPointer: Dictionary<number> = {}

export const createNewAlgorithm = async (data: GetAlgorithm) => {
  const permutations = preCalculateWeights(0, data.weights)
  const weightPermutations: WeightPermutation[] = permutations.map((weight) => {
    return {
      id: db.createId(),
      weights: weight,
      gameResults: [],
      gamesPlayed: 0,
      avgFitness: 0
    }
  })

  const algorithm: NewAlgorithm = {
    ...data,
    permutations: weightPermutations
  }

  const newE = await db.newEvolution(algorithm)
  cacheCalculatedWeights(newE.algorithmId, permutations)
  return newE
}

export const getOrCreateAlgorithm = async (data: GetAlgorithm) => {
  const algorithm = await db.getEvolutionByName(data.name)
  if (algorithm) {
    return await getSettings(algorithm.algorithmId)
  }

  return createNewAlgorithm(data)
}

export const getSettings = async (id: string) => {
  const data = await db.getSettings(id)

  if (!data) {
    return
  }

  if (_.isEmpty(data.weights)) {
    return data
  }

  data.weights = getCalculatedWeights(data.algorithmId, data.evolutionNumber, data.weights)

  return data
}

export const getBestEvaluations = async (algorithmId: string) => {
  const data = await db.getCurrentEvolution(algorithmId)

  const bestPerformingGames = _.takeRight(_.sortBy(data.gamesPlayed, 'fitness'), settings.bestPerformingGamesCount)
  const evolutionFitness = Math.ceil(_.sumBy(bestPerformingGames, 'fitness') / bestPerformingGames.length)
  const overallAvgFitness = Math.ceil(_.sumBy(data.gamesPlayed, 'fitness') / data.gamesPlayed.length)

  const aboveThreshold = _.every(_.map(bestPerformingGames, 'fitness'), function (n) {
    return n > data.evolutionFitness
  })

  if (!aboveThreshold) {
    console.log('current evolution: ' + data.evolutionNumber)
    console.log('avg overallAvgFitness: ' + overallAvgFitness + ' | old avg overallAvgFitness: ' + data.overallAvgFitness)
    console.log('Top: ' + _.map(bestPerformingGames, 'fitness'))
    console.log('Top avg evolutionFitness: ' + evolutionFitness + ' | old avg evolutionFitness: ' + data.evolutionFitness)
    return
  }

  if (bestPerformingGames.length === 0) {
    return {
      weights: data.weights,
      evolutionNumber: data.evolutionNumber,
      gamesPlayed: [],
      active: true,
      overallAvgFitness: overallAvgFitness,
      bestFitness: 0,
      evolutionFitness: evolutionFitness,
      algorithmId: data.algorithmId,
      comment: 'No evolution perfomed'
    }
  }

  const weights = _.map(bestPerformingGames, 'weights')
  const avgWeights: Weights = {}

  _.each(_.first(weights), function (value, key) {
    avgWeights[key] = _.sumBy(weights, key) / weights.length
  })

  const permutations = preCalculateWeights(data.evolutionNumber + 1, avgWeights)
  const next: Algorithm = {
    weights: avgWeights,
    name: data.name,
    evolutionNumber: data.evolutionNumber + 1,
    permutatedWeights: undefined,
    evolutionId: db.createId(),
    gamesPlayed: [],
    active: true,
    overallAvgFitness: overallAvgFitness,
    bestFitness: _.maxBy(bestPerformingGames, 'fitness').fitness,
    evolutionFitness: evolutionFitness,
    algorithmId: data.algorithmId
  }

  cacheCalculatedWeights(next.algorithmId, permutations)

  console.dir(['next evolution', next], { depth: undefined, colors: true })
  return await db.saveEvolution(next, data.evolutionId)
}

const getCalculatedWeights = (algorithmId, evolutionNumber, weights) => {
  if (preCalculatedWeights[algorithmId]) {
    let newPointerValue = ++preCalculatedWeightsPointer[algorithmId]
    if (newPointerValue >= preCalculatedWeights[algorithmId].length) {
      newPointerValue = 0
      preCalculatedWeightsPointer[algorithmId] = 0
    }

    return preCalculatedWeights[algorithmId][newPointerValue]
  }

  const permutations = preCalculateWeights(evolutionNumber, weights)
  cacheCalculatedWeights(algorithmId, permutations)
  return permutations[0]
}

export const randomDiff = (evolutionNumber: number): number => {
  return (settings.newWeigtRandomDifference - (Math.min(0.9, evolutionNumber * 0.1) * settings.newWeigtRandomDifference)) / settings.newWeigtRandomDifference
}

export const preCalculateWeights = (evolutionNumber: number, weights: Weights): Weights[] => {
  const diff = randomDiff(evolutionNumber)
  return combinations.generateCombinations(weights, diff)
}

export const cacheCalculatedWeights = (algorithmId: string, permutations: Weights[]) => {
  preCalculatedWeights[algorithmId] = permutations
  preCalculatedWeightsPointer[algorithmId] = 0
}

const runEvolution = async () => {
  try {
    const evolutions = await db.getEvolutions()

    _.each(evolutions, async (evolution) => {
      const currentEvolution = await db.getCurrentEvolution(evolution.algorithmId)
        console.log('Progress for ' + currentEvolution.name + ' ' + currentEvolution.gamesPlayed.length + '/' + settings.minGamesToEvaluate)
        if (preCalculatedWeights[currentEvolution.algorithmId] && currentEvolution.gamesPlayed.length > preCalculatedWeights[currentEvolution.algorithmId].length) {
          const bestEvolutions = await getBestEvaluations(evolution.algorithmId)

            console.log(bestEvolutions)
            console.log('Evolution!!')
        }
      })
  } catch (error) {
    console.error(error)
  }
}

export const startBackgroundEvolutionTimer = () => {
  setInterval(runEvolution, settings.timeBetweenEvolutionCalculations)

  runEvolution()
}
