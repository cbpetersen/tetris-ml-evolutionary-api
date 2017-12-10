import * as _ from 'lodash'
import * as combinations from './combinations'
import * as db from './db'

import {
  Algorithm,
  AlgorithmSettings,
  Dictionary,
  GameResult,
  GetAlgorithm,
  NewAlgorithm,
  Settings,
  WeightPermutation,
  Weights,
} from './types'
import { getEvolutions, newAlgorithm } from './db'

const settings: Settings = require('./settings.json')

export const createNewAlgorithm = async (data: GetAlgorithm) => {
  const permutations = preCalculateWeights(0, data.weights)
  const weightPermutations: WeightPermutation[] = permutations.map(weight => {
    return {
      active: true,
      gameResults: [],
      gamesPlayed: 0,
      id: db.createId(),
      totalFitness: 0,
      weights: weight,
    }
  })

  const algorithm: NewAlgorithm = {
    ...data,
    permutations: weightPermutations
  }

  return await db.newAlgorithm(algorithm)
}

export const getOrCreateAlgorithm = async (data: GetAlgorithm) => {
  const algorithm = await db.getEvolutionByName(data.name)
  if (algorithm) {
    return await getSettings(algorithm.algorithmId)
  }

  return createNewAlgorithm(data)
}

export const getSettings = async (id: string): Promise<AlgorithmSettings> => {
  const data = await db.getSettings(id)
  if (!data) {
    return
  }

  const minGamesPlayed = calculateMinimumGamesPlayedToReduce(data)
  const weightPermutations = data.permutatedWeights.filter(x => x.active && x.gamesPlayed < minGamesPlayed)
  const weightPermutation = weightPermutations.length !== 0 ? weightPermutations[0] : data.permutatedWeights[0]
  const settings: AlgorithmSettings = {
    algorithmId: data.algorithmId,
    name: data.name,
    weights: weightPermutation.weights,
    weightsId: weightPermutation.id,
  }

  return settings
}

export const reduceActiveWeights = (algorithm: Algorithm, reduceBy: number): string[] => {
  const gamesPlayed = algorithm.permutatedWeights.filter(x => x.active)
  let game
  let index = 0
  const weightsIds = []
  const sortedGames = _.sortBy(gamesPlayed, x => x.totalFitness / x.gamesPlayed)
  while (reduceBy > index && sortedGames.filter(x => x.active).length > 0) {
    game = sortedGames[index]
    if (game.active) {
      weightsIds.push(game.id)
      index++
    }
  }

  return weightsIds
}

export const calculateMinimumGamesPlayedToReduce = (algorithm: Algorithm): number => {
  const totalPermutations = algorithm.permutatedWeights.length
  if (totalPermutations === algorithm.activePermutations) {
    return settings.minGamesToEvaluate
  }

  let shifts = 0
  let temp = totalPermutations
  while (temp >= algorithm.activePermutations) {
    temp = Math.floor(temp / 2)
    shifts++
  }

  return (settings.minGamesToEvaluate / 2) * (shifts + 1)
}

export const numberOfReducableAlgoritms = (algorithm: Algorithm): number => {
  const minGamesPlayed = calculateMinimumGamesPlayedToReduce(algorithm)
  const activeAlgorithms = algorithm.permutatedWeights.filter(x => x.active)
  if (!_.every(activeAlgorithms, x => x.gamesPlayed >= minGamesPlayed)) {
    return 0
  }

  return Math.floor(algorithm.activePermutations / 2)
}

export const evolve = async (algorithm: Algorithm) => {
  const totalGamesPlayed = _.sumBy(algorithm.permutatedWeights, x => x.gamesPlayed)
  const totalFitness = _.sumBy(algorithm.permutatedWeights, x => x.totalFitness)
  const overallAvgFitness = totalFitness / totalGamesPlayed

  const permutation = algorithm.permutatedWeights.filter(x => x.active)[0]
  const {weights, gameResults, gamesPlayed} = permutation

  const permutations = preCalculateWeights(algorithm.evolutionNumber + 1, weights)
  const weightPermutations: WeightPermutation[] = permutations.map(weights => {
    return {
      active: true,
      gameResults: [],
      gamesPlayed: 0,
      id: db.createId(),
      totalFitness: 0,
      weights: weights,
      weightsId: db.createId(),
    }
  })

  const next: Algorithm = {
    active: true,
    activePermutations: weightPermutations.length,
    algorithmId: algorithm.algorithmId,
    bestFitness: _.maxBy(gameResults, 'fitness').fitness,
    evolutionFitness: permutation.totalFitness / permutation.gamesPlayed,
    evolutionId: db.createId(),
    evolutionNumber: algorithm.evolutionNumber + 1,
    name: algorithm.name,
    overallAvgFitness: overallAvgFitness,
    permutatedWeights: weightPermutations,
    weights: weights,
  }

  console.dir(['next evolution', _.omit(next, ['permutatedWeights'])], { depth: undefined, colors: true })
  return next
}

export const randomDiff = (evolutionNumber: number): number => {
  return (settings.newWeigtRandomDifference - (Math.min(0.9, evolutionNumber * 0.1) * settings.newWeigtRandomDifference)) / settings.newWeigtRandomDifference
}

export const preCalculateWeights = (evolutionNumber: number, weights: Weights): Weights[] => {
  const diff = randomDiff(evolutionNumber)
  return combinations.generateCombinations(weights, diff)
}

const runEvolution = async () => {
  try {
    const evolutions = await db.getEvolutions()

    _.each(evolutions, async (evolution) => {
      const currentEvolution = await db.getCurrentEvolution(evolution.algorithmId)

      if (currentEvolution.activePermutations === 1) {
        console.log('Evolve')
        const newEvolution = await evolve(currentEvolution)
        await db.saveNewEvolution(newEvolution, currentEvolution.evolutionId)
        console.log('Evolution!!')
        return
      }

      const minGamesPlayed = calculateMinimumGamesPlayedToReduce(currentEvolution)
      const activePermutations = currentEvolution.permutatedWeights.filter(x => x.active)
      console.log(['active', activePermutations.length, 'left', currentEvolution.permutatedWeights.filter(x => x.active && x.gamesPlayed < minGamesPlayed).length])
      const reduceBy = numberOfReducableAlgoritms(currentEvolution)
      console.log(['reduceBy', reduceBy, 'currentActive', currentEvolution.activePermutations, 'minGamesPlayed', minGamesPlayed])
      if (!reduceBy) {
        return
      }

      console.log ('reducing')
      const ids = reduceActiveWeights(currentEvolution, reduceBy)

      console.log ('save')
      ids.forEach(async (id, i) => {
        console.log (`save ${i}`)
        await db.deactivateWeights(currentEvolution.algorithmId, [id])
      })
      console.log ('done')
    })
  } catch (error) {
    console.error(error)
  }
}

export const startBackgroundEvolutionTimer = () => {
  setInterval(runEvolution, settings.timeBetweenEvolutionCalculations)

  runEvolution()
}
