#!/usr/bin/env node

const startTime = Date.now()

// Globals
global.sequences = 0
global.iterationBlock = 1000
global.iterations = 0
global.lastUniqueTime = Date.now()

// time out if no new sequences found in 1 minute
const TIMEOUT = 60 * 1000
var noNewFoundTime = 0

// Setup config vars from arguments
const { numOfSequences, linearMaximum, bar, method, maximum,
	sequenceType, METHOD_SEQUENTIAL, TYPE_CYCLIC, METHOD_RANDOM } = require('./utils/generate/config')

// pull in generation functions
const generateRandom = require('./utils/generate/random')
const generateLinear = require('./utils/generate/linear')
const generateCyclic = require('./utils/generate/cyclic')
// const generateCyclicRecursive = require('./utils/generate/recursive')

// choose which function to use
const generate = method == METHOD_SEQUENTIAL ?
	(sequenceType == TYPE_CYCLIC ? generateCyclic : generateLinear) :
	generateRandom

bar.update(0)


global.db = require('better-sqlite3')('smiles.sqlite')
// add exit hook for closing db
const exitHook = require('exit-hook')
exitHook(() => {
	db.close()
})

db.prepare(
	`CREATE TABLE IF NOT EXISTS smiles(
		id INTEGER PRIMARY KEY,
		name TEXT UNIQUE,
		smiles TEXT,
		score DOUBLE,
		miLogP DOUBLE,
		TPSA DOUBLE,
		natoms DOUBLE,
		MW DOUBLE,
		nON DOUBLE,
		nOHNH DOUBLE,
		nrotb DOUBLE,
		volume DOUBLE
	)`).run()


// Start the main loop
let iterationInterval = setInterval(function(){

	if(iterations % 1000 == 0) bar.update(sequences/numOfSequences)

	noNewFoundTime = Date.now() - lastUniqueTime

	if( sequences < numOfSequences &&
		((method == METHOD_RANDOM && noNewFoundTime < TIMEOUT) ||
		iterations < linearMaximum)
	)
		generate()
	else {

		db.close()

		clearInterval(iterationInterval)

		if(bar.curr != bar.total) bar.update(1)

		if(method == METHOD_RANDOM && noNewFoundTime >= TIMEOUT) console.log(`\nDidnt find any unique sequences for ${TIMEOUT/1000} seconds, terminating`)

		console.log(`\nComplete! Generated ${sequences} unique sequences in ${iterations} iterations\n`)

		const endTime = Date.now()
		const duration = (endTime - startTime)/1000
		const used = process.memoryUsage().heapUsed / 1024 / 1024
		console.log(`The script took ${duration}s and used approximately ${Math.round(used * 100) / 100} MB memory`)
	}
}, 0)
