declare module EApi {

  export interface Settings {
    newWeigtRandomDifference: number;
    bestPerformingGamesCount: number;
    minGamesToEvaluate: number;
    timeBetweenEvolutionCalculations: number;
  }

  export interface Weights {
  }

  export interface Algorithm {
    name: string;
    weights: Weights;
    evolutionNumber: number;
    evolutionId: string;
    permutatedWeights: any[];
    gamesPlayed: any[];
    overallAvgFitness: number;
    bestFitness: number;
    evolutionFitness: number;
    algorithmId: string;
    active: boolean;
  }
}

