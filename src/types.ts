export interface Settings {
  newWeigtRandomDifference: number
  bestPerformingGamesCount: number
  minGamesToEvaluate: number
  timeBetweenEvolutionCalculations: number
}

export interface GetAlgorithm {
  name: string
  weights: Weights
}

export class NewAlgorithm {
  name: string
  weights: Weights
  permutations: WeightPermutation[]
}
export interface Dictionary<T> {
  [key: string]: T
}
export interface Weights extends Dictionary<number> {
}

export class Algorithm {
  name: string
  weights: Weights
  evolutionNumber: number
  evolutionId: string
  // gamesPlayed: any
  permutatedWeights: WeightPermutation[]
  // gamesPlayed: any[]
  overallAvgFitness: number
  bestFitness: number
  evolutionFitness: number
  algorithmId: string
  activePermutations: number
  active: boolean
}

export interface GameResult {
  fitness: number
}

export interface WeightPermutation {
  id: string
  weights: Weights
  gameResults: GameResult[]
  gamesPlayed: number
  totalFitness: number
  active: boolean
}

export interface AlgorithmSettings {
  weights: Weights,
  weightsId: string,
  algorithmId: string,
  name: string
}
