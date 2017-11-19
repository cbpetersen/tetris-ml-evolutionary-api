const generateCombinations = (weights, randomDiff) => {
  let keys = Object.keys(weights)
  let stepsArr = [-randomDiff, 0, randomDiff]
  let arr = []

  for (let i = 0; i < keys.length; i++) {
    if (arr.length === 0) {
      arr = add(stepsArr, {}, keys[i], weights[keys[i]])
      continue
    }

    let newObjs = []
    for (let z = 0; z < arr.length; z++) {
      newObjs = add(stepsArr, arr[z], keys[i], weights[keys[i]]).concat(newObjs)
    }

    arr = newObjs
  }

  return arr
}

const add = (stepsArr, obj, keyToAdd, baseValue) => {
  let objs = []

  for (let j = 0; j < stepsArr.length; j++) {
    let o = {}
    o[keyToAdd] = stepsArr[j] + baseValue
    objs.push(Object.assign({}, obj, o))
  }

  return objs
}

exports.generateCombinations = generateCombinations
