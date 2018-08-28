const fs = require('fs-extra')
const path = require('path')

const phi = require('number-theory').eulerPhi
const divisors = require('number-theory').divisors
const sum = (arr, func) => arr.reduce( (acc, n) => acc + func(n), 0)

const startTime = Date.now()

const commandLineArgs = require('command-line-args')
const options = commandLineArgs([
	{ name: 'number', alias: 'n', type: Number, defaultValue: 0 },
	{ name: 'sequenceLength', alias: 'l', type: Number, defaultValue: 5 },
	{ name: 'outputDir', alias: 'o', type: String, defaultValue: "output" },
	{ name: 'subunitsDir', alias: 's', type: String, defaultValue: "subunits" },
	{ name: 'delimiter', alias: 'd', type: String, defaultValue: "_" },
	{ name: 'linear', type: Boolean, defaultValue: false },
	{ name: 'ringClosureDigit', alias: 'r', type: Number, defaultValue: 9 },
	{ name: 'conserve', alias: 'c', type: String },
	{ name: 'tree', alias: 't', type: Boolean, defaultValue: false},
])

const TYPE_LINEAR = 'linear'
const TYPE_CYCLIC = 'cyclic'
const METHOD_TREE = 'tree'
const METHOD_RANDOM = 'random'

const numRequested = options.number
const sequenceLength = options.sequenceLength
const outputDirectory = options.outputDir
const subunitsDirectory = options.subunitsDir
const delimiter = options.delimiter
const ringClosureDigit = options.ringClosureDigit
const sequenceType = options.linear ? TYPE_LINEAR : TYPE_CYCLIC
const methodRequested = options.tree ? METHOD_TREE : METHOD_RANDOM
const dontOutput = options.outputDir == "0" || options.outputDir == "false" ? true : false

// work out conserve options from -c 1:ADDA,4:3221
const conserved = []
var numConserved = 0
if(options.conserve){
	let c = options.conserve.split(',')
	numConserved = c.length
	for(var i in c){
		let v = c[i].split(":")
		conserved[ Number(v[0])-1 ] = v[1]
	}
}

// load subunit SMILES
const subunits = []
const subunitNames = []
const subunitShortNames = {}
const subunitCIDs = {}
const subunitFilenames = fs.readdirSync(subunitsDirectory)
for(i in subunitFilenames){
	let data = fs.readFileSync(`${subunitsDirectory}/${subunitFilenames[i]}`, {encoding: 'utf8'})
	subunits.push(data.trim())
	let name = path.parse(subunitFilenames[i]).name,
		nameSplit = name.split(delimiter)
	subunitNames.push(name)
	subunitShortNames[nameSplit[0]] = Number(i)
	if(nameSplit.length > 1) subunitCIDs[nameSplit[1]] = Number(i)
}
const subunitsLength = subunits.length

// if we dont have enough subunits, dont bother
if(subunitsLength < 1){
	console.log(`No subunit SMILES files found in the specified '${subunitsDirectory}' folder`)
	process.exit()
}

// what is the most sequences we can generate
let maximum = subunitsLength ** (sequenceLength - numConserved)
if(sequenceType == TYPE_CYCLIC && 1) {
	let n = sequenceLength,
		k = subunitsLength,
		divisorsArray = divisors(n),
		necklaces = (1/n) * sum(divisorsArray, (d) => phi(d) * k ** (n/d))

	maximum = (n % 2) ?
		(necklaces/2) + 0.5 * (k ** ((n+1)/2)) :
		(necklaces/2) + 0.25 * (k+1) * (k ** (n/2))
}

// if we have requested more sequences than is possible to generate or -1, just use maximum
const numOfSequences = numRequested < 1 ? maximum : Math.min(maximum, numRequested)

// which generation method should we use?
const method = numOfSequences == maximum || methodRequested == METHOD_TREE ? METHOD_TREE : METHOD_RANDOM
const generate = method == METHOD_TREE || numOfSequences == maximum ?
	(sequenceType == TYPE_CYCLIC ? generateCyclicTree : generateLinearTree) :
	generateRandom

// make sure output directory exists
if(!dontOutput) fs.ensureDirSync(outputDirectory)

// log out the current settings
console.log(`\nGenerating ${numOfSequences} ${sequenceType} sequences of length ${sequenceLength}, using the ${method} method`)
if(numRequested > 0 && numRequested != numOfSequences) console.log(`You requested ${numRequested} but only ${maximum} unique sequences can be generated with the current settings`)
if(sequenceType == TYPE_CYCLIC) console.log(`Using ${ringClosureDigit} as the ring closure digit`)
if(conserved.length) console.log(`Conserving subunits at the following positions: ${options.conserve.split(',').join(', ')}`)
console.log(`\nUsing subunit SMILES files from the '${subunitsDirectory}' folder (found ${subunitsLength} subunit files)`)
if(!dontOutput) console.log(`Outputting SMILES files into the '${outputDirectory}' folder\n`)

// create a new progress bar instance and use shades_classic theme
const cliProgress = require('cli-progress');
const bar = new cliProgress.Bar({hideCursor: false, format: 'Progress {bar} {percentage}%  {value}/{total} sequences found'}, cliProgress.Presets.shades_classic)
bar.start(numOfSequences, 0)



// MAIN COMPUTATION BELOW

const iterationBlock = 1000


const sequencesHash = {}
let sequences = 0

// main random generation function
function generateRandom(){
	for(let k = 0; k < iterationBlock; k++){

		// if we already have enough sequences dont bother
		if(sequences >= numOfSequences) return

		let sequenceIndexArray = [],
			sequenceHashArray = [],
			sequenceIndexString = "",
			sequenceString = "",
			filename = sequenceType+"."+sequenceLength+"."

		// generate a new random sequence
		for(i = 0; i<sequenceLength; i++){

			let subunitIndex = getConserved(i)

			// if it hasnt been conserved just do it randomly
			if(subunitIndex < 0) subunitIndex = Math.floor(Math.random()*subunitsLength)

			// add this subunit to the index array
			sequenceIndexArray.push(subunitIndex)
		}

		// check this new sequence hasnt been made already
		sequenceIndexString = sequenceIndexArray.join(",")
		if(sequencesHash.hasOwnProperty(sequenceIndexString))
			continue


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

		// update progress bar
		bar.update(sequences)
	}
}


let indexes = []
if(method == METHOD_TREE){
	for(let i = 0; i<sequenceLength; i++){
		let conserved = getConserved(i)
		indexes[i] = conserved > -1 ?
			conserved :
			(numOfSequences < maximum || 1 ? Math.floor(Math.random()*subunitsLength) : 0)
	}
}

function generateLinearTree(){
	for(let k = 0; k < iterationBlock; k++){

		// if we already have enough sequences dont bother
		if(sequences >= numOfSequences) return

		sequences++

		let sequenceString = "",
			filename = sequenceType+"."+sequenceLength+"."

		// generate output string and filename
		for (let i = 0; i < sequenceLength; i++){
			sequenceString += subunits[indexes[i]]
			filename += subunitNames[indexes[i]].split(delimiter)[0]
			if(i<sequenceLength-1) filename += delimiter
		}

		// add linear terminator
		sequenceString += "O"

		/// write to SMILES file
		if(!dontOutput) fs.writeFileSync(`${outputDirectory}/${filename}.smiles`, sequenceString)

		// make next sequence
		for ( i = 0; i < sequenceLength; i++) {

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

function getConserved(i){
	let index = -1
	if(conserved[i]) {
		let c = conserved[i]
		if(subunitShortNames.hasOwnProperty(c))
			index = subunitShortNames[c]
		else if(subunitCIDs.hasOwnProperty(c))
			index = subunitCIDs[c]
		else
			console.log(`You have specified to conserve ${c} at position ${i+1} but no source subunit was found to match '${c}', using random subunit instead`)
	}
	return index
}

function generateCyclicTree(){
	for(let k = 0; k < iterationBlock; k++){

	}
}

let iterationInterval = setInterval(function(){
	bar.update(sequences)

	if(sequences < numOfSequences)
		generate()
	else {
		clearInterval(iterationInterval)

		bar.update(sequences)
		bar.stop()
		console.log(`\nComplete! Generated ${sequences} unique sequences\n`)

		const endTime = Date.now()
		const duration = (endTime - startTime)/1000
		const used = process.memoryUsage().heapUsed / 1024 / 1024
		console.log(`The script took ${duration}s and used approximately ${Math.round(used * 100) / 100} MB memory`)
	}
}, 0)
