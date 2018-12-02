const fs = require('fs-extra')
const path = require('path')

const commandLineArgs = require('command-line-args')
const options = commandLineArgs([
	{ name: 'inputFolder', alias: 'i', type: String, defaultValue: "output" },
	{ name: 'outputFolder', alias: 'o', type: String, defaultValue: "converted" },
	{ name: 'subunits', alias: 's', type: String, defaultValue: "subunits.json" },
	{ name: 'delimiter', alias: 'd', type: String, defaultValue: "_" },
	{ name: 'number', alias: 'n', type: Number, defaultValue: 100 }
])

const delimiter = options.delimiter
const number = options.number

const sourceFolder = options.inputFolder
const outputFolder = options.outputFolder
console.log("Loading files from ", sourceFolder)
const sourceFilenames = fs.readdirSync(sourceFolder)


const subunitsString = fs.readFileSync(options.subunits)
const subunits = JSON.parse(subunitsString)

// normalize props (/2)
for(var i in subunits){
	var subunit = subunits[i]
	for(var prop in subunit){
		subunit[prop] = subunit[prop]/2
	}
}

// create a new progress bar instance and use shades_classic theme
const cliProgress = require('cli-progress');
const bar = new cliProgress.Bar({hideCursor: false, format: 'Progress {bar} {percentage}%  {value}/{total} smiles'}, cliProgress.Presets.shades_classic)


module.exports = {
	number,
	sourceFolder,
	sourceFilenames,
	outputFolder,
	subunits,
	delimiter,
	bar
}
