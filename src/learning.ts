import * as _ from 'lodash'
import * as combinations from './combinations'
import * as db from './db'

import {
  Algorithm,
  AlgorithmSettings,
  GetAlgorithm,
  NewAlgorithm,
  Settings,
  WeightPermutation,
  Weights,
} from './types'

export class Learning {
  readonly settings: Settings
  constructor(settings: Settings) {
    this.settings = settings
  }

  async createNewAlgorithm(data: GetAlgorithm) {
    const permutations = this.preCalculateWeights(0, data.weights)
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

  async getOrCreateAlgorithm(data: GetAlgorithm) {
    const algorithm = await db.getEvolutionByName(data.name)
    if (algorithm) {
      return await this.getSettings(algorithm.algorithmId)
    }

    return this.createNewAlgorithm(data)
  }

  async getSettings(id: string): Promise<AlgorithmSettings> {
    const data = await db.getSettings(id)
    if (!data) {
      return
    }

    const minGamesPlayed = this.calculateMinimumGamesPlayedToReduce(data)
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

  reduceActiveWeights(algorithm: Algorithm, reduceBy: number): string[] {
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

  calculateMinimumGamesPlayedToReduce(algorithm: Algorithm): number {
    const totalPermutations = algorithm.permutatedWeights.length
    if (totalPermutations === algorithm.activePermutations) {
      return this.settings.minGamesToEvaluate
    }

    let shifts = 0
    let temp = totalPermutations
    while (temp >= algorithm.activePermutations) {
      temp = Math.floor(temp / 2)
      shifts++
    }

    return (this.settings.minGamesToEvaluate / 2) * (shifts + 1)
  }

  numberOfReducableAlgoritms(algorithm: Algorithm): number {
    const minGamesPlayed = this.calculateMinimumGamesPlayedToReduce(algorithm)
    const activeAlgorithms = algorithm.permutatedWeights.filter(x => x.active)
    if (!_.every(activeAlgorithms, x => x.gamesPlayed >= minGamesPlayed)) {
      return 0
    }

    return Math.floor(algorithm.activePermutations / 2)
  }

  async evolve(algorithm: Algorithm) {
    const totalGamesPlayed = _.sumBy(algorithm.permutatedWeights, x => x.gamesPlayed)
    const totalFitness = _.sumBy(algorithm.permutatedWeights, x => x.totalFitness)
    const overallAvgFitness = totalFitness / totalGamesPlayed

    const permutation = algorithm.permutatedWeights.filter(x => x.active)[0]
    const { weights, gameResults, gamesPlayed } = permutation

    const permutations = this.preCalculateWeights(algorithm.evolutionNumber + 1, weights)
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

  randomDiff(evolutionNumber: number): number {
    return (this.settings.newWeigtRandomDifference - (Math.min(0.9, evolutionNumber * 0.1) * this.settings.newWeigtRandomDifference)) / this.settings.newWeigtRandomDifference
  }

  preCalculateWeights(evolutionNumber: number, weights: Weights): Weights[] {
    const diff = this.randomDiff(evolutionNumber)
    return combinations.generateCombinations(weights, diff)
  }

  async runEvolution() {
    try {
      // console.log('running');
      debugger
      const evolutions = await db.getEvolutions()
      // console.log('evolutions', evolutions.length);

      for (const evolution of evolutions) {
        const currentEvolution = await db.getCurrentEvolution(evolution.algorithmId)

        if (currentEvolution.activePermutations === 1) {
          // if (currentEvolution.permutatedWeights.every(x => x.gamesPlayed > this.settings.minGamesToEvaluate)) {
          console.log('Evolve')
          const newEvolution = await this.evolve(currentEvolution)
          console.log('newEvolution: ' + JSON.stringify(newEvolution))
          await db.saveNewEvolution(newEvolution, currentEvolution.evolutionId)
          console.log('Evolution!!')
          return
        }

        const minGamesPlayed = this.calculateMinimumGamesPlayedToReduce(currentEvolution)
        // console.log(`${currentEvolution.permutatedWeights.forEach(x => console.log(`${x.gamesPlayed} ~${x.gamesPlayed > 0 ? x.totalFitness / x.gamesPlayed : 0} | ${JSON.stringify(x.weights)}, ${x.active}`))}`)
        const activePermutations = currentEvolution.permutatedWeights.filter(x => x.active)
        console.log(['active', activePermutations.length, 'left', currentEvolution.permutatedWeights.filter(x => x.active && x.gamesPlayed < minGamesPlayed).length])
        const reduceBy = this.numberOfReducableAlgoritms(currentEvolution)
        console.log(['reduceBy', reduceBy, 'currentActive', currentEvolution.activePermutations, 'minGamesPlayed', minGamesPlayed])
        if (!reduceBy) {
          return
        }

        console.log('reducing')
        const ids = this.reduceActiveWeights(currentEvolution, reduceBy)

        console.log('save')
        for (const id of ids) {
          console.log(`save ${id}`)
          await db.deactivateWeights(currentEvolution.algorithmId, [id])
        }
        console.log('done')
      }
    } catch (error) {
      console.error(error)
    }
  }

  startBackgroundEvolutionTimer() {
    const l = this
    setInterval(l.runEvolution.bind(l), l.settings.timeBetweenEvolutionCalculations)

    this.runEvolution()
  }

}
