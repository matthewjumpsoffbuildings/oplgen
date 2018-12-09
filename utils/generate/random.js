const getConserved = require('./getConserved')
const {numOfSequences, sequenceType, sequenceLength, delimiter, dontOutput, maximum, subunits, subunitNames,
	outputDirectory, subunitsLength, TYPE_CYCLIC, ringClosureDigit, props } = require('./config')

var k, i, sequenceIndexArray, sequenceHashArray, sequenceIndexString, sequenceString,
	filename, subunitIndex, data

module.exports = function()
{
	// store sql values for sqlite batch output here
	var output = [], currentSequenceHashes = {}

	for(k = 0; k < iterationBlock; k++){

		// if we already have enough sequences dont bother
		if(sequences >= numOfSequences) break

		iterations++

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
			if(currentSequenceHashes[sequenceIndexString]) continue
			currentSequenceHashes[sequenceIndexString] = true
		}

		// generate output string and filename and prop totals
		data = Object.assign({}, props)
		for(i = 0; i<sequenceLength; i++){
			sequenceString += subunits[sequenceIndexArray[i]].smiles
			filename += subunitNames[sequenceIndexArray[i]]
			if(i<sequenceLength-1) filename += delimiter
			for(prop in props){
				data[prop] += subunits[sequenceIndexArray[i]][prop]
			}
		}

		// check if entry already exists
		var res = db.prepare(`SELECT name FROM smiles WHERE name = "${filename}"`).get()
		if(res) continue

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

		// keep track of unique sequences and time since last unique
		sequences++
		lastUniqueTime = Date.now()

		// add data to output values
		output.push( "(" + Object.values(data).join(", ") + ")")
	}

	// output this batch to sqlite, if we have any results
	if(!output.length) return
	db.prepare(`INSERT or IGNORE INTO smiles (${Object.keys(props).join(", ")}) VALUES ${output}`).run()
	output = currentSequenceHashes = null
}
