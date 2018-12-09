const fs = require('fs-extra')
const path = require('path')
const enumerate = require('./enumerate')
require('../tty')

const cannotDiverge = { 'sequenceLength':1, 'linear':1, 'conserve':1 }
var params = false
if(fs.existsSync(`.params`)) params = JSON.parse( fs.readFileSync(`.params`) )

const commandLineArgs = require('command-line-args')
const options = commandLineArgs([
	{ name: 'number', alias: 'n', type: Number, defaultValue: params ? params.number : 100000 },
	{ name: 'sequenceLength', alias: 'l', type: Number, defaultValue: params ? params.sequenceLength : 5 },
	{ name: 'subunits', alias: 's', type: String, defaultValue: params ? params.subunits : "subunits.json" },
	{ name: 'linear', type: Boolean, defaultValue: params ? params.linear : false },
	{ name: 'ringClosureDigit', alias: 'r', type: Number, defaultValue: params ? params.ringClosureDigit : 9 },
	{ name: 'conserve', alias: 'c', type: String, defaultValue: params ? params.conserve : "" },
	{ name: 'testRun', alias: 't', type: Boolean, defaultValue:  params ? params.testRun : false }
])

var param, message = "", divergent = false
if(params){
	for(param in cannotDiverge){
		if(options[param] != params[param]){
			divergent = true
			message += `\n * ${param} - requested: '${options[param]}', previous: '${params[param]}'`
			options[param] = params[param]
		}
	}
	if(divergent){
		console.log(`\nYou have run oplgen previously in this folder with the following arguments set to different values:`)
		console.log(message)
		console.log(`\nThese arguments have been restored to their previous values. Next time you run oplgen in this folder you should omit them`)
		console.log(`If you would like to generate different chains, make a new folder for them and run oplgen there\n`)
	}
}
// store options for next run
params = Object.assign(params, options)
fs.writeFileSync(`.params`, JSON.stringify(params, null, 2))


const props = {
	name: 0,
	smiles: 0,
	miLogP: 0,
	TPSA: 0,
	natoms: 0,
	MW: 0,
	nON: 0,
	nOHNH: 0,
	nrotb: 0,
	volume: 0
}

const TYPE_LINEAR = 'linear'
const TYPE_CYCLIC = 'cyclo'
const METHOD_SEQUENTIAL = 'sequential'
const METHOD_RANDOM = 'random'

const delimiter = "__"
const outputDirectory = "smiles"
const numRequested = options.number
const sequenceLength = options.sequenceLength
const subunitsFile = options.subunits
const ringClosureDigit = options.ringClosureDigit
const sequenceType = options.linear ? TYPE_LINEAR : TYPE_CYCLIC
const dontOutput = options.testRun
const methodRequested = METHOD_RANDOM //options.sequential ? METHOD_SEQUENTIAL : METHOD_RANDOM

// work out conserve options from -c 1:ADDA,4:3221
const conserved = []
var numConserved = 0
if(options.conserve.length){
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
const cyclicMaximum = Math.min( enumerate(sequenceLength, subunits.length, numConserved), linearMaximum )
const maximum = sequenceType == TYPE_CYCLIC ? cyclicMaximum : linearMaximum

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
	'Progress: :bar :percent :current/:total ',
	{ total: numOfSequences, incomplete: '░', complete: '█', renderThrottle: 200 }
)

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
	bar,
	props,
	params
}
