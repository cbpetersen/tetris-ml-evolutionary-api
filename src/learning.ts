import * as _ from 'lodash'
import * as  combinations from './combinations'
import * as db from './db'

import { getEvolutions } from './db'

const settings: EApi.Settings = require('./settings.json')

const preCalculatedWeights = {}
const preCalculatedWeightsPointer = {}

export const newAlgorithm = async (data: any) => {
  try {
    const dbRsp = await db.getEvolutions()
    if (_.some(dbRsp, {name: data.name})) {
      // let algorithm = _.first(dbRsp, {name: data.name})
      const algorithm = _.first(dbRsp)
      return await getSettings(algorithm.algorithmId)
    }

    const newE = await db.newEvolution(data)
    newE.weights = preCalculateWeights(newE.algorithmId, newE.evolutionNumber, newE.weights)
    return newE
  } catch (error) {
    console.log(error)
    throw new Error(error)
  }
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
    const avgWeights: EApi.Weights = {}

    _.each(_.first(weights), function (value, key) {
      avgWeights[key] = _.sumBy(weights, key) / weights.length
    })

    const next = {
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

    preCalculateWeights(next.algorithmId, next.evolutionNumber, next.weights)

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

  return preCalculateWeights(algorithmId, evolutionNumber, weights)
}

const preCalculateWeights = (algorithmId, evolutionNumber, weights) => {
  const randomDiff = (settings.newWeigtRandomDifference - (Math.min(0.9, evolutionNumber * 0.1) * settings.newWeigtRandomDifference)) / settings.newWeigtRandomDifference
  preCalculatedWeights[algorithmId] = combinations.generateCombinations(weights, randomDiff)
  preCalculatedWeightsPointer[algorithmId] = 0

  return preCalculatedWeights[algorithmId][0]
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

setInterval(runEvolution, settings.timeBetweenEvolutionCalculations)

runEvolution()
