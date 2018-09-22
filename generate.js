const startTime = Date.now()

// Globals
global.sequences = 0
global.sequencesHash = {}
global.iterationBlock = 1000
global.iterations = 0
global.lastUniqueTime = Date.now()

const RUN_FOREVER = false
const TIMEOUT = 60 * 1000 // time out if no new sequences found in 1 minute

// Setup config vars from arguments
const { numOfSequences, linearMaximum, bar, method, maximum,
	sequenceType, METHOD_TREE, TYPE_CYCLIC, METHOD_RANDOM } = require('./utils/generate/config')

// pull in generation functions
const generateRandom = require('./utils/generate/random')
const generateLinear = require('./utils/generate/linear')
const generateCyclic = require('./utils/generate/cyclic')
const generateCyclicRecursive = require('./utils/generate/recursive')

// choose which function to use
const generate = method == METHOD_TREE ?//|| numOfSequences == maximum ?
	(sequenceType == TYPE_CYCLIC ? generateCyclicRecursive : generateLinear) :
	generateRandom

// start the progress bar
bar.start(numOfSequences, 0)

// Start the main loop
let iterationInterval = setInterval(function(){

	bar.update(sequences)
	let noNewFoundTime = Date.now() - lastUniqueTime

	if( (RUN_FOREVER && noNewFoundTime < TIMEOUT) ||
		(noNewFoundTime < TIMEOUT && sequences < numOfSequences && (method == METHOD_RANDOM || iterations < linearMaximum)))
		generate()
	else {

		clearInterval(iterationInterval)

		bar.stop()

		if(noNewFoundTime >= TIMEOUT) console.log(`\nDidnt find any unique sequences for ${TIMEOUT/1000} seconds, terminating`)

		console.log(`\nComplete! Generated ${sequences} unique sequences in ${iterations} iterations\n`)

		const endTime = Date.now()
		const duration = (endTime - startTime)/1000
		const used = process.memoryUsage().heapUsed / 1024 / 1024
		console.log(`The script took ${duration}s and used approximately ${Math.round(used * 100) / 100} MB memory`)
	}
}, 0)
