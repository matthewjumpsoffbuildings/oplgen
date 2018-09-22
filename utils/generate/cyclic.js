const fs = require('fs-extra')
const getConserved = require('./getConserved')
const {numOfSequences, sequenceType, sequenceLength, delimiter, outputDirectory, subunitNames, linearMaximum,
	dontOutput, maximum, subunits, subunitsLength, bar, method, METHOD_TREE, TYPE_CYCLIC, ringClosureDigit} = require('./config')

let indexes = []
if(sequenceType == TYPE_CYCLIC && method == METHOD_TREE){
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
		if(sequences >= numOfSequences || iterations >= linearMaximum) return

		iterations++

		let sequenceIndexString = indexes.join(","),
			sequenceIndexArray = sequenceIndexString.split(",")

		if(!sequencesHash.hasOwnProperty(sequenceIndexString)){

			// this sequence is new, store all variations in the sequencesHash so it doesnt get repeated
			sequencesHash[sequenceIndexString] = true
			let sequenceHashArray = [sequenceIndexString]

			// generate all cyclic variations so they arent repeated either
			for(var i = 0; i <sequenceLength; i++){
				sequenceIndexArray.unshift(sequenceIndexArray.pop())
				sequenceIndexString = sequenceIndexArray.join(",")
				sequencesHash[sequenceIndexString] = true
				sequenceHashArray.push(sequenceIndexString)
				// // do mirrored version of current sequence
				// sequenceIndexArray.reverse()
				// sequenceIndexString = sequenceIndexArray.join(",")
				// sequencesHash[sequenceIndexString] = true
				// sequenceHashArray.push(sequenceIndexString)
				// // reverse again for next iteration
				// sequenceIndexArray.reverse()
			}

			// sort sequenceHashArray then use the first item as the indexArray/string
			sequenceHashArray.sort()
			sequenceIndexString = sequenceHashArray[0]
			sequenceIndexArray = sequenceIndexString.split(",")

			var sequenceString = "",
				filename = sequenceType+"."+sequenceLength+"."

			// generate output string and filename
			for (i = 0; i < sequenceLength; i++){
				sequenceString += subunits[sequenceIndexArray[i]]
				filename += subunitNames[sequenceIndexArray[i]].split(delimiter)[0]
				if(i<sequenceLength-1) filename += delimiter
			}

			// add terminators
			sequenceString = sequenceString.replace(/^(.)/i, '$&'+ringClosureDigit) // add closure digit after first character
			sequenceString = sequenceString.replace(/\(=O\)$/i, ringClosureDigit+'(=O)') // add closure digit after last (=O)

			/// write to SMILES file
			if(!dontOutput) fs.writeFileSync(`${outputDirectory}/${filename}.smiles`, sequenceString)

			// increment sequences count
			sequences++
		}

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
