const fs = require('fs-extra')
const getConserved = require('./getConserved')
const {numOfSequences, sequenceType, sequenceLength, delimiter, outputDirectory, subunitNames, linearMaximum,
	dontOutput, maximum, subunits, subunitsLength, method, METHOD_SEQUENTIAL, TYPE_CYCLIC, ringClosureDigit} = require('./config')

var indexes = [], conserved, sequenceIndexArray, sequenceIndexString, sequenceHashArray, k, i, sequenceString, filename

if(sequenceType == TYPE_CYCLIC && method == METHOD_SEQUENTIAL){
	for(i = 0; i<sequenceLength; i++){
		conserved = getConserved(i)
		indexes[i] = conserved > -1 ?
			conserved :
			(numOfSequences < maximum ? Math.floor(Math.random()*subunitsLength) : 0)
	}
}

module.exports = function(){
	for(k = 0; k < iterationBlock; k++){
		// if we already have enough sequences dont bother
		if(sequences >= numOfSequences || iterations > linearMaximum) return

		iterations++

		sequenceIndexString = indexes.join(",")
		sequenceIndexArray = sequenceIndexString.split(",")

		if(!sequencesHash.hasOwnProperty(sequenceIndexString)){

			// this sequence is new, store all variations in the sequencesHash so it doesnt get repeated
			sequencesHash[sequenceIndexString] = true
			sequenceHashArray = [sequenceIndexString]

			// generate all cyclic variations so they arent repeated either
			for(i = 0; i <sequenceLength; i++){
				sequenceIndexArray.unshift(sequenceIndexArray.pop())
				sequenceIndexString = sequenceIndexArray.join(",")
				sequencesHash[sequenceIndexString] = true
				sequenceHashArray.push(sequenceIndexString)
			}

			// sort sequenceHashArray then use the first item as the indexArray/string
			sequenceHashArray.sort()
			sequenceIndexString = sequenceHashArray[0]
			sequenceIndexArray = sequenceIndexString.split(",")

			sequenceString = ""
			filename = sequenceType+"."+sequenceLength+"."

			// generate output string and filename
			for (i = 0; i < sequenceLength; i++){
				sequenceString += subunits[sequenceIndexArray[i]].smiles
				filename += subunitNames[sequenceIndexArray[i]]
				if(i<sequenceLength-1) filename += delimiter
			}

			// add terminators
			sequenceString = sequenceString.replace(/^(.)/i, '$&'+ringClosureDigit) // add closure digit after first character
			sequenceString = sequenceString.replace(/\(=O\)$/i, ringClosureDigit+'(=O)') // add closure digit after last (=O)

			// add metadata
			sequenceString += ' '+filename

			/// write to SMILES file
			if(!dontOutput) fs.writeFileSync(`${outputDirectory}/${filename}.smiles`, sequenceString)

			// increment sequences count
			sequences++
		}

		// make next sequence
		for (i = 0; i < sequenceLength; i++) {

			if(getConserved(i) > -1) continue

			if (indexes[i] >= subunitsLength - 1)
				indexes[i] = 0
			else {
				indexes[i]++
				break
			}
		}
	}
}
