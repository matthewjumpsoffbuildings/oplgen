#!/usr/bin/env node

const startTime = Date.now()
const cluster = require('cluster')
const child_process = require('child_process')
const workers = []

require('./utils/db')

// Globals
var totalSequences = 0
var totalIterations = 0
var lastUniqueTime = Date.now()


// time out if no new sequences found in 1 minute
const TIMEOUT = 60 * 1000
var noNewFoundTime = 0

// Setup config vars from arguments
const {
	numOfSequences, linearMaximum, bar, method, maximum, props, sequenceType, subunitsHash,
	sequenceLength, delimiter, subunits, subunitNames, subunitsLength, conserved,
	ringClosureDigit, METHOD_SEQUENTIAL, TYPE_CYCLIC, METHOD_RANDOM
}
= require('./utils/generate/config')

// set up db worker
// const dbWorker = child_process.fork('./utils/db')
// dbWorker.on('message', function(message){
// 	if(message.newSequences) {
// 		totalSequences += message.newSequences
// 		lastUniqueTime = Date.now()
// 	} else
// 		noNewFoundTime = Date.now() - lastUniqueTime

// 	if(totalSequences < numOfSequences) bar.update(totalSequences/numOfSequences)
// 	console.log("master db updated", process.memoryUsage().rss / 1024 / 1024)
// })

const db = require('better-sqlite3')('smiles.sqlite', {readonly: true})
const countSQL = db.prepare(`SELECT count(id) FROM smiles`)

console.log("Master", process.pid)

const numCPUs = Math.max(2, require('os').cpus().length)
for (var i = 0; i < numCPUs-1; i++) {
	const worker = child_process.fork('./utils/generate/random')
	console.log("worker ", i+1, worker.pid)
	workers.push(worker)
	worker.on('message', function(message){ workerListener(worker, message)})
	worker.send({
		options: { numOfSequences, sequenceType, sequenceLength, delimiter, maximum,
			subunits, subunitNames, subunitsHash, subunitsLength, ringClosureDigit, conserved
		},
		iterate: true
	})
}

function workerListener(currentWorker, message) {
	totalIterations += message.iterations

	// check if we should exit
	if(!keepAlive()) process.exit()

	var newSequences = countSQL.get()["count(id)"]
	if(newSequences > totalSequences)
		lastUniqueTime = Date.now()
	else
		noNewFoundTime = Date.now() - lastUniqueTime

	totalSequences = newSequences
	if(totalSequences < numOfSequences) 
		bar.update(totalSequences/numOfSequences)
	else if(bar.curr < bar.total) 
		bar.update(1)

	currentWorker.send({iterate:true })
	// console.log("master worker msg", process.memoryUsage().rss / 1024 / 1024)
}


// should the process keep going?
function keepAlive(){
	return totalSequences < numOfSequences &&
		((method == METHOD_RANDOM && noNewFoundTime < TIMEOUT) ||
		totalIterations < linearMaximum)
}

const exitHook = require('exit-hook')
exitHook(exit)
var exited = false
function exit()
{
	if(exited) return
	exited = true

	db.close()
	// dbWorker.kill()
	for(var w in workers){
		workers[w].kill()
	}

	if(method == METHOD_RANDOM && noNewFoundTime >= TIMEOUT) console.log(`\nDidnt find any unique sequences for ${TIMEOUT/1000} seconds, terminating`)

	console.log(`\nComplete! Generated ${totalSequences} unique sequences in ${totalIterations} iterations\n`)

	const endTime = Date.now()
	const duration = (endTime - startTime)/1000
	const used = process.memoryUsage().rss / 1024 / 1024
	console.log(`The script took ${duration}s and used approximately ${Math.round(used * 100) / 100} MB memory`)
}
