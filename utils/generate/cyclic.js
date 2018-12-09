const fs = require('fs-extra')
const getConserved = require('./getConserved')
const {numOfSequences, sequenceType, sequenceLength, delimiter, outputDirectory, subunitNames, linearMaximum,
	dontOutput, maximum, subunits, subunitsLength, method, METHOD_SEQUENTIAL, TYPE_CYCLIC, ringClosureDigit, props, params
} = require('./config')

var indexes = [], conserved, sequenceIndexArray, sequenceIndexString, sequenceHashArray,
	k, i, sequenceString, filename, data

if(sequenceType == TYPE_CYCLIC && method == METHOD_SEQUENTIAL){
	for(i = 0; i<sequenceLength; i++){
		conserved = getConserved(i)
		indexes[i] = conserved > -1 ?
			conserved :
			(numOfSequences < maximum ? Math.floor(Math.random()*subunitsLength) : 0)
	}

	// if we have an unfinished sequential generate, start where we left off
	if(params && params.lastSequentialIndexes && params.lastSequentialIndexes.length)
		indexes = params.lastSequentialIndexes

	// add exit hook for storing indexes
	const exitHook = require('exit-hook')
	exitHook(() => {
		// store indexes for next run
		params.lastSequentialIndexes = indexes
		fs.writeFileSync(`.params`, JSON.stringify(params, null, 2))
	})
}

module.exports = function(){
	// store sql values for sqlite batch output here
	var output = [], currentSequenceHashes = {}

	for(k = 0; k < iterationBlock; k++){
		// if we already have enough sequences dont bother
		if(sequences >= numOfSequences || iterations > linearMaximum) break

		iterations++

		sequenceIndexString = indexes.join(",")
		sequenceIndexArray = sequenceIndexString.split(",")
		sequenceHashArray = [sequenceIndexString]

		// generate all cyclic variations
		for(i = 0; i <sequenceLength; i++){
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

		sequenceString = ""
		filename = sequenceType+"."+sequenceLength+"."

		// generate output string and filename and prop totals
		data = Object.assign({}, props)
		for (i = 0; i < sequenceLength; i++){
			sequenceString += subunits[sequenceIndexArray[i]].smiles
			filename += subunitNames[sequenceIndexArray[i]]
			if(i<sequenceLength-1) filename += delimiter
			for(prop in props){
				data[prop] += subunits[sequenceIndexArray[i]][prop]
			}
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

		// ---------
		// output stage for current sequence

		// check if entry already exists
		var res = db.prepare(`SELECT name FROM smiles WHERE name = "${filename}"`).get()
		if(res) continue

		// add terminators
		sequenceString = sequenceString.replace(/^(.)/i, '$&'+ringClosureDigit) // add closure digit after first character
		sequenceString = sequenceString.replace(/\(=O\)$/i, ringClosureDigit+'(=O)') // add closure digit after last (=O)

		// add and smiles and metadata
		sequenceString += ' '+filename
		data.smiles = '"'+sequenceString+'"'
		data.name = '"'+filename+'"'

		/// write to SMILES file
		if(!dontOutput) fs.writeFileSync(`${outputDirectory}/${filename}.smiles`, sequenceString)

		// increment sequences count
		sequences++

		// add data to output values
		output.push( "(" + Object.values(data).join(", ") + ")")
	}

	// output this batch to sqlite, if we have any results
	if(!output.length) return
	db.prepare(`INSERT or IGNORE INTO smiles (${Object.keys(props).join(", ")}) VALUES ${output}`).run()
	output = currentSequenceHashes = null
}
