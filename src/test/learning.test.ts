import * as _ from 'lodash'

import { Algorithm, GameResult, NewAlgorithm, WeightPermutation, Weights } from '../types'
import { Learning } from '../learning'

import * as settings from '../settings.json'
const learning = new Learning({...settings, newWeigtRandomDifference: 22, minGamesToEvaluate: 20})

describe('preCalculateWeights', () => {
  const weights: Weights = {
    propOne: 1
  }

  it('return 3 weights', () => {
    const result = learning.preCalculateWeights(0.001, weights)

    expect(result.length).toBe(3)
  })

  it('uses the diff', () => {
    const result = learning.preCalculateWeights(0.001, weights)

    expect(result[0].propOne).toBeCloseTo(0)
  })
})

describe('randomDiff', () => {
  it('should have a high value for the 1st evolution', () => {
    const result = learning.randomDiff(1)

    expect(result).toBeCloseTo(0.9)
  })

  it('should have a little lower value for the 3rd evolution', () => {
    const result = learning.randomDiff(3)

    expect(result).toBeCloseTo(0.7)
  })

  it('should have a much lower value for the 10th evolution', () => {
    const result = learning.randomDiff(10)

    expect(result).toBeCloseTo(0.1)
  })

  it('should have a lower limit for the 100th evolution', () => {
    const result = learning.randomDiff(100)

    expect(result).toBeCloseTo(0.1)
  })
})

const AlgorithmFactory = (permutations: number, avgGamesPlayed: number): Algorithm  => {
  const algoritm = new Algorithm()
  algoritm.activePermutations = permutations
  algoritm.permutatedWeights = _.range(permutations).map(x => {
    return permutatedWeightFactory(avgGamesPlayed, _.random())
  })

  return algoritm
}

const permutatedWeightFactory = (gamesPlayed: number, totalFitness: number): WeightPermutation => {
  const gameResults = _.range(gamesPlayed).map(() => {
    return {
      fitness: totalFitness,
    }
  })

  return {
      active: true,
      totalFitness: totalFitness,
      gamesPlayed: gamesPlayed,
      id: _.uniqueId('al'),
      gameResults: gameResults,
      weights: {
        w1: 1,
        w2: 2
      }
  }
}

describe('reducing active algrothms', () => {
  describe('reducing 4 weights to 3', () => {
    it('should reduce the length of the array with one', () => {
        const al = new Algorithm()
        al.permutatedWeights = [
          permutatedWeightFactory(10, 1),
          permutatedWeightFactory(10, 0),
          permutatedWeightFactory(10, 3),
          permutatedWeightFactory(10, 0)
        ]

      const result = learning.reduceActiveWeights(al, 1)

      expect(result).toBeDefined()
      expect(result).toHaveLength(1)
    })

    it('should reduce the array with the weights with the worst performance', () => {
      const al = new Algorithm()
      al.permutatedWeights = [
        permutatedWeightFactory(10, 3),
        permutatedWeightFactory(10, 0),
        permutatedWeightFactory(10, 1),
        permutatedWeightFactory(10, 2)
      ]

      const result = learning.reduceActiveWeights(al, 1)

        expect(result).toHaveLength(1)
        expect(result).toContain(al.permutatedWeights[1].id)
    })

    describe('reducing 4 weights to 2', () => {
      it('should reduce the length of the array with one', () => {
          const al = new Algorithm()
          al.permutatedWeights = [
            permutatedWeightFactory(10, 1),
            permutatedWeightFactory(10, 2),
            permutatedWeightFactory(10, 3),
            permutatedWeightFactory(10, 4)
          ]

        const result = learning.reduceActiveWeights(al, 2)

        expect(result).toHaveLength(2)
        expect(result).toContain(al.permutatedWeights[0].id)
        expect(result).toContain(al.permutatedWeights[1].id)
      })

      it('should reduce the array with the weights with the worst performance', () => {
        const al = new Algorithm()
        const expectedResult = [
          permutatedWeightFactory(10, 3),
          permutatedWeightFactory(10, 4)
        ]
        al.permutatedWeights = [
          permutatedWeightFactory(10, 1),
          permutatedWeightFactory(10, 2),
          ...expectedResult,
        ]

        const result = learning.reduceActiveWeights(al, 2)

        expect(result).toHaveLength(2)
        expect(result).toContain(al.permutatedWeights[0].id)
        expect(result).toContain(al.permutatedWeights[1].id)
      })
    })
  })
})

describe('calculateMinimumGamesPlayedToReduce', () => {
  describe('when all permutations is active', () => {
    it('should return 20 for 1 permutation for the first evolution', () => {
      const algorithm = AlgorithmFactory(5, 5)
      algorithm.evolutionNumber = 1
      const result = learning.calculateMinimumGamesPlayedToReduce(algorithm)

      expect(result).toBe(20)
    })

    it('should return 20 for 2nd evolution', () => {
      const algorithm = AlgorithmFactory(2, 5)
      algorithm.evolutionNumber = 2
      const result = learning.calculateMinimumGamesPlayedToReduce(algorithm)

      expect(result).toBe(20)
    })

    it('should return 20 for 3nd evolution', () => {
      const algorithm = AlgorithmFactory(2, 5)
      algorithm.evolutionNumber = 2
      const result = learning.calculateMinimumGamesPlayedToReduce(algorithm)

      expect(result).toBe(20)
    })
  })

  describe('when 50% permutations is active', () => {
    const permutations = 10
    const activePermutations = permutations / 2

    it('should return 50% more for the first evolution', () => {
      const algorithm = AlgorithmFactory(permutations, 5)
      algorithm.evolutionNumber = 1
      algorithm.activePermutations = activePermutations
      const result = learning.calculateMinimumGamesPlayedToReduce(algorithm)

      expect(result).toBe(20 * 1.50)
    })

    it('should return 50% more for 2nd evolution', () => {
      const algorithm = AlgorithmFactory(permutations, 5)
      algorithm.evolutionNumber = 2
      algorithm.activePermutations = activePermutations
      const result = learning.calculateMinimumGamesPlayedToReduce(algorithm)

      expect(result).toBe(20 * 1.50)
    })

    it('should return 50% more for 3nd evolution', () => {
      const algorithm = AlgorithmFactory(permutations, 5)
      algorithm.evolutionNumber = 2
      algorithm.activePermutations = activePermutations
      const result = learning.calculateMinimumGamesPlayedToReduce(algorithm)

      expect(result).toBe(20 * 1.50)
    })
  })

  describe('when 25% permutations is active', () => {
    const permutations = 10
    const activePermutations = Math.floor(permutations  / 4)

    it('should return 100% more for 1 permutation for the first evolution', () => {
      const algorithm = AlgorithmFactory(permutations, 5)
      algorithm.evolutionNumber = 1
      algorithm.activePermutations = activePermutations
      const result = learning.calculateMinimumGamesPlayedToReduce(algorithm)

      expect(result).toBe(20 * 2)
    })

    it('should return 100% more for 2nd evolution', () => {
      const algorithm = AlgorithmFactory(permutations, 5)
      algorithm.evolutionNumber = 2
      algorithm.activePermutations = activePermutations
      const result = learning.calculateMinimumGamesPlayedToReduce(algorithm)

      expect(result).toBe(20 * 2)
    })

    it('should return 100% more for 3nd evolution', () => {
      const algorithm = AlgorithmFactory(permutations, 5)
      algorithm.evolutionNumber = 2
      algorithm.activePermutations = activePermutations
      const result = learning.calculateMinimumGamesPlayedToReduce(algorithm)

      expect(result).toBe(20 * 2)
    })
  })
})

describe('numberOfReducableAlgoritms', () => {
  it('should return zero when to few games has been played', () => {
    const algorithm = AlgorithmFactory(5, 5)
    const result = learning.numberOfReducableAlgoritms(algorithm)

    expect(result).toBe(0)
  })

  it('should return 1 when when enough games has been played on 3 permutations', () => {
    const algorithm = AlgorithmFactory(3, 21)
    const result = learning.numberOfReducableAlgoritms(algorithm)

    expect(result).toBe(1)
  })


  it('should return 2 when when enough games has been played on 4 permutations', () => {
    const algorithm = AlgorithmFactory(4, 21)
    const result = learning.numberOfReducableAlgoritms(algorithm)

    expect(result).toBe(2)
  })
})
