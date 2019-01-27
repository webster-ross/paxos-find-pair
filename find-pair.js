#!/usr/bin/env node
const yargs = require('yargs')
const fs = require('fs')
const readline = require('readline')
const stream = require('stream')

// parse arguments
const argv = yargs.usage('$0 <file> <balance>', '', (yargs) => {
  yargs.positional('file', {
    describe: 'price file',
    type: 'string'
  })
  yargs.positional('balance', {
    describe: 'card balance',
    type: 'number'
  })
}).argv

// read file as stream
const input = fs.createReadStream(argv.file)
input.on('error', () => { console.error(`Unable to open file '${argv.file}'`) })

const output = new stream
const rl = readline.createInterface(input, output)
rl.on('error', function() { console.error(`Unable to parse file '${argv.file}'`) })

const prices = []

// process each line of file
rl.on('line', line => {
  let [item, price] = line.split(',')
  item = item.trim()
  price = parseInt(price)

  // only keep valid lines
  if (item.length > 0 && price > 0 && price < argv.balance) prices.push([price, item])

  // stop parsing if no more valid lines
  if (price >= argv.balance) { rl.close() }
})

// find items
rl.on('close', function() {
  let [left, right, finalLeft, finalRight] = [0, prices.length - 1, 0, 0]
  let finalDiff = Number.MAX_SAFE_INTEGER

  // compare price differences starting with the highest & lowest values
  while(left < right) {
    const [leftPrice] = prices[left]
    const [rightPrice] = prices[right]
    const diff = argv.balance - (leftPrice + rightPrice)

    // save lowest valid difference found
    if(diff >= 0 && diff < finalDiff) {
      [finalDiff, finalLeft, finalRight] = [diff, left, right]
    }

    if(leftPrice + rightPrice < argv.balance) left++
    else right--
  }

  if(finalDiff != Number.MAX_SAFE_INTEGER) {
    const [price1, item1] = prices[finalLeft]
    const [price2, item2] = prices[finalRight]
    console.log(`${item1} ${price1}`)
    console.log(`${item2} ${price2}`)
  }
  else console.log('Not possible')
})
