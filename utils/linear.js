const fs = require('fs-extra')
const getConserved = require('./getConserved')
const {numOfSequences, sequenceType, sequenceLength, delimiter, dontOutput, maximum, outputDirectory,
	subunits, subunitsLength, subunitNames, bar, method, METHOD_TREE, TYPE_LINEAR, ringClosureDigit} = require('./config')

let indexes = []
if(sequenceType == TYPE_LINEAR && method == METHOD_TREE){
	for(var i = 0; i<sequenceLength; i++){
		var conserved = getConserved(i)
		indexes[i] = conserved > -1 ?
			conserved :
			(numOfSequences < maximum ? Math.floor(Math.random()*subunitsLength) : 0)
	}
}

module.exports = function(){
	for(var k = 0; k < iterationBlock; k++){

		// if we already have enough sequences dont bother
		if(sequences >= numOfSequences) return

		iterations++

		let sequenceString = "",
			filename = sequenceType+"."+sequenceLength+"."

		// generate output string and filename
		for (var i = 0; i < sequenceLength; i++){
			sequenceString += subunits[indexes[i]]
			filename += subunitNames[indexes[i]].split(delimiter)[0]
			if(i<sequenceLength-1) filename += delimiter
		}

		// add terminator
		sequenceString += "O"

		/// write to SMILES file
		if(!dontOutput) fs.writeFileSync(`${outputDirectory}/${filename}.smiles`, sequenceString)

		// increment sequences count
		sequences++

		// make next sequence
		for (i = 0; i < sequenceLength; i++) {

			let conserved = getConserved(i)
			if(conserved > -1) continue

			if (indexes[i] >= subunitsLength - 1)
				indexes[i] = 0
			else {
				indexes[i]++
				break
			}
		}
	}
}
