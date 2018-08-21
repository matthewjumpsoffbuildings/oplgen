const fs = require('fs-extra')

const commandLineArgs = require('command-line-args')
const options = commandLineArgs([
	{ name: 'numOfSequences', alias: 'n', type: Number, defaultValue: 1000 },
	{ name: 'sequenceLength', alias: 'l', type: Number, defaultValue: 10 },
	{ name: 'outputDirectory', alias: 'o', type: String, defaultValue: "output" },
	{ name: 'subunitsDirectory', alias: 's', type: String, defaultValue: "subunits" }
])

const sequencesNeeded = options.numOfSequences
const sequenceLengthNeeded = options.sequenceLength
const outputDirectory = options.outputDirectory
const subunitsDirectory = options.subunitsDirectory

// log out the current settings
console.log(`Generating ${sequencesNeeded} sequences of length ${sequenceLengthNeeded}`)
console.log(`Using subunit SMILES files from the '${subunitsDirectory}' folder`)
console.log(`Outputting SMILES files into the '${outputDirectory}' folder\n`)

// create a new progress bar instance and use shades_classic theme
const cliProgress = require('cli-progress');
const bar = new cliProgress.Bar({}, cliProgress.Presets.shades_classic)
bar.start(sequencesNeeded, 0)



// load subunit SMILES
const subunits = []
const subunitFilenames = fs.readdirSync(subunitsDirectory)
for(var i in subunitFilenames){
	let data = fs.readFileSync(`${subunitsDirectory}/${subunitFilenames[i]}`, {encoding: 'utf8'})
	subunits.push(data.trim())
}
if(subunits.length < 1){
	console.log(`No subunit SMILES files found in the specified '${subunitsDirectory}' folder`)
	process.exit()
}

// make sure the specified sequence length is long enough to generate enough unique sequences
if(sequenceLengthNeeded ** subunits.length < sequencesNeeded){
	console.log(`Your specified sequence length of ${sequenceLengthNeeded} is too short to generate ${sequencesNeeded} unique sequences`)
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
	for(var i = 0; i<sequenceLengthNeeded; i++){
		let subunitIndex = Math.floor(Math.random()*subunits.length),
			subunitString = subunits[subunitIndex]

		sequenceString += subunitString
		sequenceIndexArray.push(subunitIndex)
	}

	// check this new sequence hasnt been made already
	sequenceIndexString = sequenceIndexArray.join(",")
	if(sequencesHash.hasOwnProperty(sequenceIndexString))
		continue

	// this sequence is new, store all variations in the sequencesHash so it doesnt get repeated
	for(i = 0; i <sequenceLengthNeeded; i++){
		sequenceIndexArray.unshift(sequenceIndexArray.pop())
		sequenceIndexString = sequenceIndexArray.join(",")
		sequencesHash[sequenceIndexString] = true
	}

	// add 1s to make closed loop
	sequenceString += "1"
	sequenceString = sequenceString.substr(0, 1) + "1" + sequenceString.substr(1)

	// store sequence in array
	sequences.push(sequenceString)

	// write to SMILES file
	fs.writeFileSync(`${outputDirectory}/${sequences.length}.smiles`, sequenceString)

	// update progress bar
	bar.update(sequences.length)
}

// stop progress bar
bar.stop()

console.log('\nSuccess!\n')

// const used = process.memoryUsage().heapUsed / 1024 / 1024
// console.log(`The script used approximately ${Math.round(used * 100) / 100} MB`)
