const fs = require('fs-extra')
const path = require('path')

const commandLineArgs = require('command-line-args')
const options = commandLineArgs([
	{ name: 'numOfSequences', alias: 'n', type: Number, defaultValue: 100 },
	{ name: 'sequenceLength', alias: 'l', type: Number, defaultValue: 5 },
	{ name: 'outputDir', alias: 'o', type: String, defaultValue: "output" },
	{ name: 'subunitsDir', alias: 's', type: String, defaultValue: "subunits" },
	{ name: 'delimiter', alias: 'd', type: String, defaultValue: "_" },
	{ name: 'linear', type: Boolean, defaultValue: false }
])

const TYPE_LINEAR = 'lin'
const TYPE_CYCLIC = 'cyc'

const sequencesNeeded = options.numOfSequences
const sequenceLength = options.sequenceLength
const outputDirectory = options.outputDir
const subunitsDirectory = options.subunitsDir
const delimiter = options.delimiter
const sequenceType = options.linear ? TYPE_LINEAR : TYPE_CYCLIC

// log out the current settings
console.log(`\nGenerating ${sequencesNeeded} ${sequenceType} sequences of length ${sequenceLength}`)
console.log(`Using subunit SMILES files from the '${subunitsDirectory}' folder`)
console.log(`Outputting SMILES files into the '${outputDirectory}' folder\n`)

// create a new progress bar instance and use shades_classic theme
const cliProgress = require('cli-progress');
const bar = new cliProgress.Bar({hideCursor: true, format: 'Progress {bar} {percentage}%  {value}/{total}'}, cliProgress.Presets.shades_classic)
bar.start(sequencesNeeded, 0)



// load subunit SMILES
const subunits = []
const subunitNames = []
const subunitFilenames = fs.readdirSync(subunitsDirectory)
for(var i in subunitFilenames){
	let data = fs.readFileSync(`${subunitsDirectory}/${subunitFilenames[i]}`, {encoding: 'utf8'})
	subunits.push(data.trim())
	subunitNames.push(path.parse(subunitFilenames[i]).name)
}
if(subunits.length < 1){
	console.log(`No subunit SMILES files found in the specified '${subunitsDirectory}' folder`)
	process.exit()
}

// make sure the specified sequence length is long enough to generate enough unique sequences
if(subunits.length ** sequenceLength < sequencesNeeded){
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
	for(var i = 0; i<sequenceLength; i++){
		let subunitIndex = Math.floor(Math.random()*subunits.length),
			subunitString = subunits[subunitIndex]

		sequenceString += subunitString
		sequenceIndexArray.push(subunitIndex)
	}

	// check this new sequence hasnt been made already
	sequenceIndexString = sequenceIndexArray.join(",")
	if(sequencesHash.hasOwnProperty(sequenceIndexString))
		continue

	// generate output filename
	let filename = sequenceType+"."
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
		sequenceString = sequenceString.replace(/^(.)/i, '$&1') // add 1 after first character
		sequenceString = sequenceString.replace(/\(=O\)$/i, '1(=O)') // add 1 after last (=O)
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
