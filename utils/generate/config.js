const fs = require('fs-extra')
const path = require('path')
const enumerate = require('./enumerate')

const commandLineArgs = require('command-line-args')
const options = commandLineArgs([
	{ name: 'number', alias: 'n', type: Number, defaultValue: 100000 },
	{ name: 'sequenceLength', alias: 'l', type: Number, defaultValue: 5 },
	{ name: 'outputDir', alias: 'o', type: String, defaultValue: "smiles" },
	{ name: 'subunits', alias: 's', type: String, defaultValue: "subunits.json" },
	{ name: 'delimiter', alias: 'd', type: String, defaultValue: "__" },
	{ name: 'linear', type: Boolean, defaultValue: false },
	{ name: 'ringClosureDigit', alias: 'r', type: Number, defaultValue: 9 },
	{ name: 'conserve', alias: 'c', type: String },
	{ name: 'sequential', alias: 'q', type: Boolean, defaultValue: false}
])

const TYPE_LINEAR = 'linear'
const TYPE_CYCLIC = 'cyclo'
const METHOD_SEQUENTIAL = 'sequential'
const METHOD_RANDOM = 'random'

const numRequested = options.number
const sequenceLength = options.sequenceLength
const outputDirectory = options.outputDir
const subunitsFile = options.subunits
const delimiter = options.delimiter
const ringClosureDigit = options.ringClosureDigit
const sequenceType = options.linear ? TYPE_LINEAR : TYPE_CYCLIC
const methodRequested = options.sequential ? METHOD_SEQUENTIAL : METHOD_RANDOM
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
const defaultJSONPath = require('../subunits-path')
const jsonPath = fs.existsSync(subunitsFile) ? subunitsFile : defaultJSONPath
const subunitNames = []
const subunits = []
const subunitsHash = JSON.parse( fs.readFileSync(jsonPath))
var i = 0;
for(var s in subunitsHash){
	subunitNames.push(s)
	subunits.push(subunitsHash[s])
	subunitsHash[s].index = i
	i++
}
const subunitsLength = subunits.length

// if we dont have enough subunits, dont bother
if(subunitsLength < 1){
	console.log(`No subunit SMILES files found in the specified '${subunitsFile}' file`)
	process.exit()
}

// what is the most sequences we can generate
const linearMaximum = subunitsLength ** (sequenceLength - numConserved)
const cyclicMaximum = enumerate(sequenceLength, subunits.length, numConserved)
const maximum = sequenceType == TYPE_CYCLIC ? Math.min(cyclicMaximum, linearMaximum) : linearMaximum

// if we have requested more sequences than is possible to generate or 0, just use maximum
const numOfSequences = numRequested < 1 ? maximum : Math.min(maximum, numRequested)

// which generation method should we use?
const method = methodRequested == METHOD_SEQUENTIAL || numOfSequences == maximum ?
	METHOD_SEQUENTIAL : METHOD_RANDOM

// make sure output directory exists
if(!dontOutput) fs.ensureDirSync(outputDirectory)

// log out the current settings
console.log(`\nGenerating ${numOfSequences} ${sequenceType} sequences of length ${sequenceLength}, using the ${method} method`)
console.log(`Could generate up to ${linearMaximum} linear sequences and ${cyclicMaximum} cyclic sequences with the current sequence length and settings`)
if(numRequested > 0 && numRequested != numOfSequences) console.log(`You requested ${numRequested} but only ${maximum} unique sequences can be generated with the current settings`)
if(sequenceType == TYPE_CYCLIC) console.log(`Using ${ringClosureDigit} as the ring closure digit`)
if(conserved.length) console.log(`Conserving subunits at the following positions: ${options.conserve.split(',').join(', ')}`)
console.log(`\nUsing subunit SMILES from the '${subunitsFile}' file (found ${subunitsLength} subunits)`)
if(!dontOutput) console.log(`Outputting SMILES files into the '${outputDirectory}' folder\n`)

// create a new progress bar instance
const ProgressBar = require('progress')
const bar = new ProgressBar(
	'Progress :bar :percent :current/:total sequences found ',
	{ total: numOfSequences, incomplete: '░', complete: '█', renderThrottle: 200 }
)

// show warning if not running in tty console
require('../tty-warning')("oplgen.cmd")


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
	METHOD_SEQUENTIAL,
	METHOD_RANDOM,
	TYPE_CYCLIC,
	TYPE_LINEAR,
	maximum,
	linearMaximum,
	dontOutput,
	subunits,
	subunitsHash,
	subunitsLength,
	subunitNames,
	conserved,
	bar
}
