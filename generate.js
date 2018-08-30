const startTime = Date.now()

// Globals
global.sequences = 0
global.sequencesHash = {}
global.iterationBlock = 1000
global.iterations = 0

// Setup config vars from arguments
const { numOfSequences, linearMaximum, bar, method, maximum,
	sequenceType, METHOD_TREE, TYPE_CYCLIC, METHOD_RANDOM } = require('./utils/config')

// pull in generation functions
const generateRandom = require('./utils/random')
const generateLinear = require('./utils/linear')
const generateCyclic = require('./utils/cyclic')

const generate = method == METHOD_TREE ?//|| numOfSequences == maximum ?
	(sequenceType == TYPE_CYCLIC ? generateCyclic : generateLinear) :
	generateRandom

// Start the main loop
let iterationInterval = setInterval(function(){
	bar.update(sequences)
	if(sequences < numOfSequences && (method == METHOD_RANDOM || iterations < linearMaximum))
		generate()
	else {
		clearInterval(iterationInterval)

		bar.update(sequences)
		bar.stop()
		console.log(`\nComplete! Generated ${sequences} unique sequences in ${iterations} iterations\n`)

		const endTime = Date.now()
		const duration = (endTime - startTime)/1000
		const used = process.memoryUsage().heapUsed / 1024 / 1024
		console.log(`The script took ${duration}s and used approximately ${Math.round(used * 100) / 100} MB memory`)
	}
}, 0)
