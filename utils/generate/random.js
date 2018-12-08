const fs = require('fs-extra')
const getConserved = require('./getConserved')
const {numOfSequences, sequenceType, sequenceLength, delimiter, dontOutput, maximum, subunits, subunitNames,
	outputDirectory, subunitsLength, TYPE_CYCLIC, ringClosureDigit} = require('./config')

var k, i, sequenceIndexArray, sequenceHashArray, sequenceIndexString, sequenceString,
	filename, subunitIndex

module.exports = function()
{
	for(k = 0; k < iterationBlock; k++){

		// if we already have enough sequences dont bother
		if(sequences >= numOfSequences) return

		iterations++

		sequenceIndexArray = []
		sequenceHashArray = []
		sequenceIndexString = ""
		sequenceString = ""
		filename = sequenceType+"."+sequenceLength+"."

		// generate a new random sequence
		for(i = 0; i<sequenceLength; i++){

			subunitIndex = getConserved(i)

			// if it hasnt been conserved just do it randomly
			if(subunitIndex < 0) subunitIndex = Math.floor(Math.random()*subunitsLength)

			// add this subunit to the index array
			sequenceIndexArray.push(subunitIndex)
		}

		// get string of sequence
		sequenceIndexString = sequenceIndexArray.join(",")
		sequenceHashArray.push(sequenceIndexString)

		// if we are in cyclic mode, generate all cyclic variations so they arent repeated either
		if(sequenceType == TYPE_CYCLIC){
			for(i = 0; i <sequenceLength; i++){
				sequenceIndexArray.unshift(sequenceIndexArray.pop())
				sequenceHashArray.push(sequenceIndexArray.join(","))
			}

			// sort sequenceHashArray then use the first item as the indexArray/string
			sequenceHashArray.sort()
			sequenceIndexString = sequenceHashArray[0]
			sequenceIndexArray = sequenceIndexString.split(",")
		}

		// generate output string and filename
		for(i = 0; i<sequenceLength; i++){
			sequenceString += subunits[sequenceIndexArray[i]].smiles
			filename += subunitNames[sequenceIndexArray[i]]
			if(i<sequenceLength-1) filename += delimiter
		}

		// check if file already exists
		if(fs.existsSync(`${outputDirectory}/${filename}.smiles`))
			continue

		// add terminators etc
		if(sequenceType == TYPE_CYCLIC){
			sequenceString = sequenceString.replace(/^(.)/i, '$&'+ringClosureDigit) // add closure digit after first character
			sequenceString = sequenceString.replace(/\(=O\)$/i, ringClosureDigit+'(=O)') // add closure digit after last (=O)
		} else
			sequenceString += "O"

		// add metadata
		sequenceString += ' '+filename

		sequences++

		lastUniqueTime = Date.now()

		// write to SMILES file
		if(!dontOutput) fs.writeFileSync(`${outputDirectory}/${filename}.smiles`, sequenceString)
	}
}
