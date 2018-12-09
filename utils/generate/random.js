const getConserved = require('./getConserved')
const {numOfSequences, sequenceType, sequenceLength, delimiter, dontOutput, maximum, subunits, subunitNames,
	outputDirectory, subunitsLength, TYPE_CYCLIC, ringClosureDigit, props } = require('./config')

var k, i, sequenceIndexArray, sequenceHashArray, sequenceIndexString, sequenceString,
	filename, subunitIndex, data, output, currentSequences

const checkFilenameQuery = db.prepare(`SELECT name FROM smiles WHERE name = ?`)

module.exports = function()
{
	currentSequences = {}
	output = []

	for(k = 0; k < iterationBlock; k++){

		// if we already have enough sequences dont bother
		if(totalSequences >= numOfSequences) break

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

			// check against any generated in the current iteration block (eg not in the db yet)
			if(currentSequences[sequenceIndexString]) continue
		}

		// generate output string and filename and prop totals
		data = Object.assign({}, props)
		currentSequences[sequenceIndexString] = data
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
		data.smiles = '"'+sequenceString+'"'
		data.name = '"'+filename+'"'
	}

	if(!output.length) return

	// send results to master process
	process.send({
		iterations: k,
		data: output
	})

	currentSequences = output = null
}
