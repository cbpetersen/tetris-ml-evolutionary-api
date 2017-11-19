import {} from 'jest'

import * as learning from '../learning'

import { Weights } from '../types'

jest.mock('../db')
jest.mock('../settings.json', () => ({
  newWeigtRandomDifference: 20
}), { virtual: true })

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

    expect(result).toBe(0.9)
  })

  it('should have a little lower value for the 3rd evolution', () => {
    const result = learning.randomDiff(3)

    expect(result).toBe(0.7)
  })

  it('should have a much lower value for the 10rd evolution', () => {
    const result = learning.randomDiff(10)

    expect(result).toBe(0.1)
  })
})
