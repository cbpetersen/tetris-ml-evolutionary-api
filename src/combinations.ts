export const generateCombinations = (weights: any, randomDiff: number) => {
  let keys = Object.keys(weights)
  let stepsArr = [-randomDiff, 0, randomDiff]
  let arr: ReadonlyArray<any> = []

  for (let i = 0; i < keys.length; i++) {
    if (arr.length === 0) {
      arr = add(stepsArr, {}, keys[i], weights[keys[i]])
      continue
    }

    let newObjs: ReadonlyArray<any> = []
    for (let z = 0; z < arr.length; z++) {
      newObjs = add(stepsArr, arr[z], keys[i], weights[keys[i]]).concat(newObjs)
    }

    arr = newObjs
  }

  return arr
}

const add = (stepsArr: number[], obj: any, keyToAdd: string, baseValue: number) => {
  let objs = []

  for (let j = 0; j < stepsArr.length; j++) {
    let o:any = {}
    o[keyToAdd] = stepsArr[j] + baseValue
    objs.push({...obj, o})
  }

  return objs
}
