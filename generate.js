const fs = require('fs-extra')
const path = require('path')

const commandLineArgs = require('command-line-args')
const options = commandLineArgs([
	{ name: 'numOfSequences', alias: 'n', type: Number, defaultValue: 100 },
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

const sequencesNeeded = options.numOfSequences
const sequenceLength = options.sequenceLength
const outputDirectory = options.outputDir
const subunitsDirectory = options.subunitsDir
const delimiter = options.delimiter
const ringClosureDigit = options.ringClosureDigit
const sequenceType = options.linear ? TYPE_LINEAR : TYPE_CYCLIC

// work out conserve options from -c 1:ADDA,4:3221
const conserved = []
if(options.conserve){
	let c = options.conserve.split(',')
	for(var i in c){
		let v = c[i].split(":")
		conserved[ Number(v[0])-1 ] = v[1]
	}
}

// log out the current settings
console.log(`\nGenerating ${sequencesNeeded} ${sequenceType} sequences of length ${sequenceLength}`)
if(sequenceType == TYPE_CYCLIC) console.log(`Using ${ringClosureDigit} as the ring closure digit`)
if(conserved.length) console.log(`Conserving subunits at the following positions: ${options.conserve.split(',').join(', ')}`)
console.log(`Using subunit SMILES files from the '${subunitsDirectory}' folder`)
console.log(`Outputting SMILES files into the '${outputDirectory}' folder\n`)

// create a new progress bar instance and use shades_classic theme
const cliProgress = require('cli-progress');
const bar = new cliProgress.Bar({hideCursor: true, format: 'Progress {bar} {percentage}%  {value}/{total}'}, cliProgress.Presets.shades_classic)
bar.start(sequencesNeeded, 0)



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

// make sure the specified sequence length is long enough to generate enough unique sequences
if((subunits.length - conserved.length) ** sequenceLength < sequencesNeeded){
	console.log(`Your specified sequence length of ${sequenceLength} is too short to generate ${sequencesNeeded} unique sequences`)
	process.exit()
}

// make sure output directory exists
fs.ensureDirSync(outputDirectory)



const sequencesHash = {}
const sequences = []

// start the main generation loop
while(sequences.length < sequencesNeeded){

	let sequenceIndexArray = [],
		sequenceIndexString = "",
		sequenceString = ""

	// generate a new random sequence
	for(i = 0; i<sequenceLength; i++){

		let subunitIndex

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
		if(!subunitIndex) subunitIndex = Math.floor(Math.random()*subunits.length)

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
	if(sequenceType == TYPE_CYCLIC){
		for(i = 0; i <sequenceLength; i++){
			sequenceIndexArray.unshift(sequenceIndexArray.pop())
			sequenceIndexString = sequenceIndexArray.join(",")
			sequencesHash[sequenceIndexString] = true
		}
	}

	// add terminators etc
	if(sequenceType == TYPE_CYCLIC){
		sequenceString = sequenceString.replace(/^(.)/i, '$&'+ringClosureDigit) // add closure digit after first character
		sequenceString = sequenceString.replace(/\(=O\)$/i, ringClosureDigit+'(=O)') // add closure digit after last (=O)
	} else {
		sequenceString += "O"
	}

	// store sequence in array
	sequences.push(sequenceString)

	// write to SMILES file
	fs.writeFileSync(`${outputDirectory}/${filename}.smiles`, sequenceString)

	// update progress bar
	bar.update(sequences.length)
}

// stop progress bar
bar.stop()

console.log('\nSuccess!\n')

// const used = process.memoryUsage().heapUsed / 1024 / 1024
// console.log(`The script used approximately ${Math.round(used * 100) / 100} MB`)
