const fs = require('fs-extra')
const getConserved = require('./getConserved')
const {numOfSequences, sequenceType, sequenceLength, delimiter, dontOutput, maximum, linearMaximum, outputDirectory,
	subunits, subunitsLength, subunitNames, method, METHOD_SEQUENTIAL, TYPE_LINEAR, ringClosureDigit} = require('./config')

var indexes = [], conserved, i, k

if(sequenceType == TYPE_LINEAR && method == METHOD_SEQUENTIAL){
	for(i = 0; i<sequenceLength; i++){
		conserved = getConserved(i)
		indexes[i] = conserved > -1 ?
			conserved :
			(numOfSequences < maximum ? Math.floor(Math.random()*subunitsLength) : 0)
	}
}

module.exports = function(){
	// TODO convert to sqlite
	return
	for(k = 0; k < iterationBlock; k++){
		// if we already have enough sequences dont bother
		if(sequences >= numOfSequences || iterations > linearMaximum) return

		iterations++

		let sequenceString = "",
			filename = sequenceType+"."+sequenceLength+"."

		// generate output string and filename
		for (i = 0; i < sequenceLength; i++){
			sequenceString += subunits[indexes[i]].smiles
			filename += subunitNames[indexes[i]]
			if(i<sequenceLength-1) filename += delimiter
		}

		// add terminator
		sequenceString += "O"

		// add metadata
		sequenceString += ' '+filename

		/// write to SMILES file
		if(!dontOutput) fs.writeFileSync(`${outputDirectory}/${filename}.smiles`, sequenceString)

		// increment sequences count
		sequences++

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
