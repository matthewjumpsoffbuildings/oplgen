const fs = require('fs-extra')
const path = require('path')

const commandLineArgs = require('command-line-args')
const options = commandLineArgs([
	{ name: 'source', alias: 's', type: String, defaultValue: "output" },
	{ name: 'conserve', alias: 'c', type: String },
	{ name: 'subunitsJSON', alias: 'j', type: String, defaultValue: "subunits.json" },
	{ name: 'delimiter', alias: 'd', type: String, defaultValue: "_" }
])

const delimiter = options.delimiter


const sourceFolder = options.source
console.log("Loading files from ", sourceFolder)
const sourceFilenames = fs.readdirSync(sourceFolder)


const subunitsString = fs.readFileSync(options.subunitsJSON)
const subunits = JSON.parse(subunitsString)


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

// create a new progress bar instance and use shades_classic theme
const cliProgress = require('cli-progress');
const bar = new cliProgress.Bar({hideCursor: false, format: 'Progress {bar} {percentage}%  {value}/{total} smiles - found {matches} matches'}, cliProgress.Presets.shades_classic)


module.exports = {
	sourceFolder,
	sourceFilenames,
	conserved,
	subunits,
	delimiter,
	bar
}
