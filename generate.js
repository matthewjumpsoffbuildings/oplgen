const fs = require('fs-extra')
const path = require('path')

const phi = require('number-theory').eulerPhi
const divisors = require('number-theory').divisors

const startTime = Date.now()

const commandLineArgs = require('command-line-args')
const options = commandLineArgs([
	{ name: 'iterations', alias: 'i', type: Number, defaultValue: 1000 },
	{ name: 'sequenceLength', alias: 'l', type: Number, defaultValue: 5 },
	{ name: 'outputDir', alias: 'o', type: String, defaultValue: "output" },
	{ name: 'subunitsDir', alias: 's', type: String, defaultValue: "subunits" },
	{ name: 'delimiter', alias: 'd', type: String, defaultValue: "_" },
	{ name: 'linear', type: Boolean, defaultValue: false },
	{ name: 'ringClosureDigit', alias: 'r', type: Number, defaultValue: 9 },
	{ name: 'conserve', alias: 'c', type: String }
])

const TYPE_LINEAR = 'lin'
const TYPE_CYCLIC = 'cyc'

const iterations = options.iterations
const sequenceLength = options.sequenceLength
const outputDirectory = options.outputDir
const subunitsDirectory = options.subunitsDir
const delimiter = options.delimiter
const ringClosureDigit = options.ringClosureDigit
const sequenceType = options.linear ? TYPE_LINEAR : TYPE_CYCLIC

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
	subunitShortNames[nameSplit[0]] = i
	if(nameSplit.length > 1) subunitCIDs[nameSplit[1]] = i
}

// if we dont have enough subunits, dont bother
if(subunits.length < 1){
	console.log(`No subunit SMILES files found in the specified '${subunitsDirectory}' folder`)
	process.exit()
}

// what is the most sequences we can generate
let maximum = subunits.length ** (sequenceLength - numConserved)
if(sequenceType == TYPE_CYCLIC && 1) {
	let n = sequenceLength,
		k = subunits.length,
		sum = (arr, func) => arr.reduce( (acc, n) => acc + func(n), arr[0]),
		divisorsArray = divisors(n),
		necklaces = (1/n) * sum(divisorsArray, (d) => phi(d) * k ** (n/d))

	maximum = (n % 2) ?
		(necklaces/2) + 0.5 * (k ** ((n+1)/2)) :
		(necklaces/2) + 0.25 * (k+1) * (k ** (n/2))
	maximum = Math.floor(maximum)
}

// make sure output directory exists
fs.ensureDirSync(outputDirectory)

// log out the current settings
console.log(`\nRunning ${iterations} iterations to generate ${sequenceType} sequences of length ${sequenceLength}`)
if(sequenceType == TYPE_CYCLIC) console.log(`Using ${ringClosureDigit} as the ring closure digit`)
if(conserved.length) console.log(`Conserving subunits at the following positions: ${options.conserve.split(',').join(', ')}`)
console.log(`Could generate up to ${maximum} unique sequences with the current settings`)
console.log(`\nUsing subunit SMILES files from the '${subunitsDirectory}' folder (found ${subunits.length} subunit files)`)
console.log(`Outputting SMILES files into the '${outputDirectory}' folder\n`)

// create a new progress bar instance and use shades_classic theme
const cliProgress = require('cli-progress');
const bar = new cliProgress.Bar({hideCursor: false, format: 'Progress {bar} {percentage}%  {value}/{total} Iterations  {unique} Unique sequences found'}, cliProgress.Presets.shades_classic)
bar.start(iterations, 0, {unique: 0})


const sequencesHash = {}
const sequences = []
let iterationsCompleted = 0

// main generation function
function generate(){
for(let k = 0; k < 1000; k++){

	iterationsCompleted++

	let sequenceIndexArray = [],
		sequenceIndexString = "",
		sequenceString = ""

	// generate a new random sequence
	for(i = 0; i<sequenceLength; i++){

		let subunitIndex = -1

		// has the user specified a conserved subunit for this position in the chain
		if(conserved[i]) {
			let c = conserved[i]
			if(subunitShortNames.hasOwnProperty(c))
				subunitIndex = subunitShortNames[c]
			else if(subunitCIDs.hasOwnProperty(c))
				subunitIndex = subunitCIDs[c]
			else
				console.log(`You have specified to conserve ${c} at position ${i+1} but no source subunit was found to match '${c}', using random subunit instead`)
		}

		// if we havent set it yet, just do it randomly
		if(subunitIndex < 0) subunitIndex = Math.floor(Math.random()*subunits.length)

		sequenceString += subunits[subunitIndex]
		sequenceIndexArray.push(subunitIndex)
	}

	// check this new sequence hasnt been made already
	sequenceIndexString = sequenceIndexArray.join(",")
	if(sequencesHash.hasOwnProperty(sequenceIndexString))
		continue

	// generate output filename
	let filename = sequenceType+"."+sequenceLength+"."
	for(i = 0; i<sequenceLength; i++){
		filename += subunitNames[sequenceIndexArray[i]].split(delimiter)[0]
		if(i<sequenceLength-1) filename += delimiter
	}

	// this sequence is new, store all variations in the sequencesHash so it doesnt get repeated
	sequencesHash[sequenceIndexString] = true
	if(sequenceType == TYPE_CYCLIC){
		for(i = 0; i <sequenceLength; i++){
			sequenceIndexArray.unshift(sequenceIndexArray.pop())
			sequenceIndexString = sequenceIndexArray.join(",")
			sequencesHash[sequenceIndexString] = true
			sequenceIndexArray.reverse()
			sequenceIndexString = sequenceIndexArray.join(",")
			sequencesHash[sequenceIndexString] = true
			sequenceIndexArray.reverse()
		}
	}

	// add terminators etc
	if(sequenceType == TYPE_CYCLIC){
		sequenceString = sequenceString.replace(/^(.)/i, '$&'+ringClosureDigit) // add closure digit after first character
		sequenceString = sequenceString.replace(/\(=O\)$/i, ringClosureDigit+'(=O)') // add closure digit after last (=O)
	} else
		sequenceString += "O"

	// store sequence in array
	sequences.push(sequenceString)

	// write to SMILES file
	fs.writeFileSync(`${outputDirectory}/${filename}.smiles`, sequenceString)

	// update progress bar
	bar.update(iterationsCompleted, {unique: sequences.length})
}
}

let iterationInterval = setInterval(function(){
	bar.update(iterationsCompleted, {unique: sequences.length})

	if(iterationsCompleted < iterations && sequences.length < maximum)
		generate()
	else {
		clearInterval(iterationInterval)

		bar.update(iterations, {unique: sequences.length})
		bar.stop()
		console.log(`\nComplete! Generated ${sequences.length} unique sequences\n`)
		if(iterationsCompleted < iterations) console.log('saved iterations', iterations-iterationsCompleted)

		const endTime = Date.now()
		const duration = (endTime - startTime)/1000
		const used = process.memoryUsage().heapUsed / 1024 / 1024
		console.log(`The script took ${duration}s and used approximately ${Math.round(used * 100) / 100} MB memory`)
	}
}, 0)
