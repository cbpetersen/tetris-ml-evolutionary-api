import * as perm from '../combinations'

import { Weights } from '../types'

// const learning = require('../learning')
describe('preCalculateWeights', () => {
  const weights: Weights = {
    propOne: 0,
    PropTwo: 0,
    PropThree: 0
  }

  it('return a number of permutations equal to the number of weights^weights', () => {
    const result = perm.generateCombinations(weights, 1)

    expect(result.length).toBe(3 * 3 * 3)
  })
})
