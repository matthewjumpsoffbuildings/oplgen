const fs = require('fs-extra')
const getConserved = require('./getConserved')
const {numOfSequences, sequenceType, sequenceLength, delimiter, dontOutput, maximum, subunits, subunitNames,
	outputDirectory, subunitsLength, bar, TYPE_CYCLIC, ringClosureDigit} = require('./config')

module.exports = function(){
	for(let k = 0; k < iterationBlock; k++){

		// if we already have enough sequences dont bother
		// if(sequences >= numOfSequences) return

		iterations++

		var sequenceIndexArray = [],
			sequenceHashArray = [],
			sequenceIndexString = "",
			sequenceString = "",
			filename = sequenceType+"."+sequenceLength+".",
			subunitIndex

		// generate a new random sequence
		for(i = 0; i<sequenceLength; i++){

			subunitIndex = getConserved(i)

			// if it hasnt been conserved just do it randomly
			if(subunitIndex < 0) subunitIndex = Math.floor(Math.random()*subunitsLength)

			// add this subunit to the index array
			sequenceIndexArray.push(subunitIndex)
		}

		// check this new sequence hasnt been made already
		sequenceIndexString = sequenceIndexArray.join(",")
		if(sequencesHash.hasOwnProperty(sequenceIndexString))
			continue

		// console.log(sequenceIndexArray)

		// this sequence is new, store all variations in the sequencesHash so it doesnt get repeated
		sequencesHash[sequenceIndexString] = true
		sequenceHashArray.push(sequenceIndexString)

		// if we are in cyclic mode, generate all cyclic variations so they arent repeated either
		if(sequenceType == TYPE_CYCLIC){
			for(i = 0; i <sequenceLength; i++){
				sequenceIndexArray.unshift(sequenceIndexArray.pop())
				sequenceIndexString = sequenceIndexArray.join(",")
				sequencesHash[sequenceIndexString] = true
				sequenceHashArray.push(sequenceIndexString)
				// do mirrored version of current sequence
				sequenceIndexArray.reverse()
				sequenceIndexString = sequenceIndexArray.join(",")
				sequencesHash[sequenceIndexString] = true
				sequenceHashArray.push(sequenceIndexString)
				// reverse again for next iteration
				sequenceIndexArray.reverse()
			}

			// sort sequenceHashArray then use the first item as the indexArray/string
			sequenceHashArray.sort()
			sequenceIndexString = sequenceHashArray[0]
			sequenceIndexArray = sequenceIndexString.split(",")
		}

		// generate output string and filename
		for(i = 0; i<sequenceLength; i++){
			sequenceString += subunits[sequenceIndexArray[i]]
			filename += subunitNames[sequenceIndexArray[i]].split(delimiter)[0]
			if(i<sequenceLength-1) filename += delimiter
		}

		// add terminators etc
		if(sequenceType == TYPE_CYCLIC){
			sequenceString = sequenceString.replace(/^(.)/i, '$&'+ringClosureDigit) // add closure digit after first character
			sequenceString = sequenceString.replace(/\(=O\)$/i, ringClosureDigit+'(=O)') // add closure digit after last (=O)
		} else
			sequenceString += "O"

		sequences++

		// write to SMILES file
		if(!dontOutput) fs.writeFileSync(`${outputDirectory}/${filename}.smiles`, sequenceString)
	}
}
