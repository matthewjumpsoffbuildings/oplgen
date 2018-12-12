const getConserved = require('./getConserved')
const { TYPE_CYCLIC } = require('./consts')
const props = require('../props')

const db = require('better-sqlite3')('smiles.sqlite')
const exitHook = require('exit-hook')
exitHook(() => { db.close() })

const insertSQL = db.prepare(`INSERT or IGNORE INTO smiles (${Object.keys(props).join(", ")}) VALUES (@${Object.keys(props).join(", @")})`);
const insertTransation = db.transaction((smiles) => {
	for (const s of smiles) insertSQL.run(s)
})

const ITERATION_BLOCK = 4000

process.on('message', (message) => {
	if(message.options) setOptions(message.options)
	if(message.iterate) iterate()
})

function setOptions(options){
	for(var i in options){
		global[i] = options[i]
	}
}

var k, i, sequenceIndexArray, sequenceHashArray, sequenceIndexString, sequenceString,
		name, subunitIndex, res, data = {}, output = [], written = false, oldCount, newCount

function iterate()
{
	const block = ITERATION_BLOCK + (Math.random()*ITERATION_BLOCK)

	for(k = 0; k < block; k++){

		sequenceIndexArray = []
		sequenceHashArray = []
		sequenceIndexString = ""
		sequenceString = ""
		name = sequenceType+"."+sequenceLength+"."

		// generate a new random sequence, maintaining conserved positions
		for(i = 0; i<sequenceLength; i++){
			subunitIndex = getConserved(i)
			if(subunitIndex < 0) subunitIndex = Math.floor(Math.random()*subunitsLength)
			sequenceIndexArray.push(subunitIndex)
		}

		// get string of sequence
		sequenceIndexString = sequenceIndexArray.join(",")
		sequenceHashArray.push(sequenceIndexString)

		// if we are in cyclic mode, generate all cyclic variations so they arent repeated either
		if(sequenceType == TYPE_CYCLIC){
			for(i = 0; i < sequenceLength; i++){
				sequenceIndexArray.unshift(sequenceIndexArray.pop())
				sequenceHashArray.push(sequenceIndexArray.join(","))
			}

			// sort sequenceHashArray then use the first item as the indexArray/string
			sequenceHashArray.sort()
			sequenceIndexString = sequenceHashArray[0]
			sequenceIndexArray = sequenceIndexString.split(",")
		}

		// generate name
		for(i = 0; i < sequenceLength; i++){
			name += subunitNames[sequenceIndexArray[i]]
			if(i<sequenceLength-1) name += delimiter
		}

		// generate output string and prop totals
		data = {}
		for(prop in props){ data[prop] = props[prop] }
		for(i = 0; i < sequenceLength; i++){
			sequenceString += subunits[sequenceIndexArray[i]].smiles
			for(prop in props){
				data[prop] += subunits[sequenceIndexArray[i]][prop]
			}
		}

		// add terminators etc
		if(sequenceType == TYPE_CYCLIC){
			sequenceString = sequenceString.replace(/^(.)/i, '$&'+ringClosureDigit) // add closure digit after first character
			sequenceString = sequenceString.replace(/\(=O\)$/i, ringClosureDigit+'(=O)') // add closure digit after last (=O)
		} else
			sequenceString += "O"

		// add and smiles and metadata
		sequenceString += ' '+name
		data.smiles = '"'+sequenceString+'"'
		data.name = '"'+name+'"'

		output.push(data)
	}

	written = false, newSequences = 0
	while(!written){
		try {
			insertTransation(output)
			written = true
		} catch(e) {
			written = false
		}
	}

	output = []

	process.send({
		iterations: k
	})

	// console.log("gen", process.pid, process.memoryUsage().rss / 1024 / 1024)
}
