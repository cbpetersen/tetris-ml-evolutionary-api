// declare module EApi {

export interface Settings {
    newWeigtRandomDifference: number;
    bestPerformingGamesCount: number;
    minGamesToEvaluate: number;
    timeBetweenEvolutionCalculations: number;
  }

  interface GetAlgorithm {
    name: string;
    weights: Weights
  }

  declare class NewAlgorithm{
    name: string;
    weights: Weights
    permutations: WeightPermutation[]
  }
  interface Dictionary<T> {
    [key: string]: T
  }
  export interface Weights extends Dictionary<number> {
  }

  export interface Algorithm {
    name: string;
    weights: Weights;
    evolutionNumber: number;
    evolutionId: string;
    permutatedWeights: WeightPermutation[];
    gamesPlayed: any[];
    overallAvgFitness: number;
    bestFitness: number;
    evolutionFitness: number;
    algorithmId: string;
    active: boolean;
  }

  export interface GameResult {
    fitness: number;
  }

  export interface WeightPermutation {
    id: string;
    weights: Weights;
    gameResults: GameResult[];
    gamesPlayed: number;
    avgFitness: number;
  }
// }
