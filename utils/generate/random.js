const getConserved = require('./getConserved')
const { TYPE_CYCLIC, ITERATION_BLOCK } = require('./consts')

// const checkFilenameQuery = db.prepare(`SELECT name FROM smiles WHERE name = ?`)

var options
var totalSequences = 0
var totalIterations = 0
var lastUniqueTime = 0


process.on('message', (message) => {
	if(message.totalSequences) totalSequences = message.totalSequences
	if(message.totalIterations) totalIterations = message.totalIterations
	if(message.lastUniqueTime) lastUniqueTime = message.lastUniqueTime
	if(message.options) setOptions(message.options)
	if(message.iterate) iterate()
})

function setOptions(options){
	for(var i in options){
		global[i] = options[i]
	}
}

function iterate()
{
	let k, i, sequenceIndexArray, sequenceHashArray, sequenceIndexString, sequenceString,
		filename, subunitIndex, data = {}, output = []

	for(k = 0; k < ITERATION_BLOCK; k++){

		sequenceIndexArray = []
		sequenceHashArray = []
		sequenceIndexString = ""
		sequenceString = ""
		filename = sequenceType+"."+sequenceLength+"."

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

		// generate output string and filename and prop totals
		data = Object.assign({}, props)
		output.push(data)
		for(i = 0; i<sequenceLength; i++){
			sequenceString += subunits[sequenceIndexArray[i]].smiles
			filename += subunitNames[sequenceIndexArray[i]]
			if(i<sequenceLength-1) filename += delimiter
			for(prop in props){
				data[prop] += subunits[sequenceIndexArray[i]][prop]
			}
		}

		// // check if entry already exists
		// var res = checkFilenameQuery.get(filename)
		// if(res) continue

		// add terminators etc
		if(sequenceType == TYPE_CYCLIC){
			sequenceString = sequenceString.replace(/^(.)/i, '$&'+ringClosureDigit) // add closure digit after first character
			sequenceString = sequenceString.replace(/\(=O\)$/i, ringClosureDigit+'(=O)') // add closure digit after last (=O)
		} else
			sequenceString += "O"

		// add and smiles and metadata
		sequenceString += ' '+filename
		data.smiles = ""// '"'+sequenceString+'"'
		data.name = '"'+filename+'"'
	}

	if(!output.length) return

	// send results to master process
	process.send({
		iterations: k,
		data: output
	})
}
