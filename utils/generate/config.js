const fs = require('fs-extra')
const path = require('path')
const enumerate = require('./enumerate')

const commandLineArgs = require('command-line-args')
const options = commandLineArgs([
	{ name: 'number', alias: 'n', type: Number, defaultValue: 0 },
	{ name: 'sequenceLength', alias: 'l', type: Number, defaultValue: 5 },
	{ name: 'outputDir', alias: 'o', type: String, defaultValue: "output" },
	{ name: 'subunits', alias: 's', type: String, defaultValue: "subunits.json" },
	{ name: 'delimiter', alias: 'd', type: String, defaultValue: "_" },
	{ name: 'linear', type: Boolean, defaultValue: false },
	{ name: 'ringClosureDigit', alias: 'r', type: Number, defaultValue: 9 },
	{ name: 'conserve', alias: 'c', type: String },
	{ name: 'tree', alias: 't', type: Boolean, defaultValue: false}
])

const TYPE_LINEAR = 'linear'
const TYPE_CYCLIC = 'cyclic'
const METHOD_TREE = 'tree'
const METHOD_RANDOM = 'random'

const numRequested = options.number
const sequenceLength = options.sequenceLength
const outputDirectory = options.outputDir
const subunitsFile = options.subunits
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
const subunitsJSON = JSON.parse( fs.readFileSync(subunitsFile))

var n = 0
for(var s in subunitsJSON){
	var subunit = subunitsJSON[s]
	subunitShortNames[s] = n
	subunitNames.push(s)
	subunits.push(subunit)
	n++
}
const subunitsLength = subunits.length

// if we dont have enough subunits, dont bother
if(subunitsLength < 1){
	console.log(`No subunit SMILES files found in the specified '${subunitsFile}' file`)
	process.exit()
}

// what is the most sequences we can generate
const linearMaximum = subunitsLength ** (sequenceLength - numConserved)
let maximum = linearMaximum
if(sequenceType == TYPE_CYCLIC)
	maximum = Math.min(enumerate(sequenceLength, subunits.length, numConserved), linearMaximum)

// if we have requested more sequences than is possible to generate or -1, just use maximum
const numOfSequences = numRequested < 1 ? maximum : Math.min(maximum, numRequested)

// which generation method should we use?
const method = methodRequested == METHOD_TREE ? METHOD_TREE : METHOD_RANDOM

// make sure output directory exists
if(!dontOutput) fs.ensureDirSync(outputDirectory)

// log out the current settings
console.log(`\nGenerating ${numOfSequences} ${sequenceType} sequences of length ${sequenceLength}, using the ${method} method`)
console.log(`Could generate up to ${linearMaximum} linear sequences`)
if(numRequested > 0 && numRequested != numOfSequences) console.log(`You requested ${numRequested} but only ${maximum} unique sequences can be generated with the current settings`)
if(sequenceType == TYPE_CYCLIC) console.log(`Using ${ringClosureDigit} as the ring closure digit`)
if(conserved.length) console.log(`Conserving subunits at the following positions: ${options.conserve.split(',').join(', ')}`)
console.log(`\nUsing subunit SMILES files from the '${subunitsFile}' file (found ${subunitsLength} subunits)`)
if(!dontOutput) console.log(`Outputting SMILES files into the '${outputDirectory}' folder\n`)

// create a new progress bar instance and use shades_classic theme
const cliProgress = require('cli-progress');
const bar = new cliProgress.Bar({hideCursor: false, format: 'Progress {bar} {percentage}%  {value}/{total} sequences found'}, cliProgress.Presets.shades_classic)



// export everything
module.exports = {
	numRequested,
	numOfSequences,
	sequenceLength,
	outputDirectory,
	subunitsFile,
	delimiter,
	ringClosureDigit,
	sequenceType,
	methodRequested,
	method,
	METHOD_TREE,
	METHOD_RANDOM,
	TYPE_CYCLIC,
	TYPE_LINEAR,
	maximum,
	linearMaximum,
	dontOutput,
	subunits,
	subunitsLength,
	subunitNames,
	subunitShortNames,
	conserved,
	bar
}
