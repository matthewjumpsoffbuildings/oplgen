const fs = require('fs-extra')
const path = require('path')
require('../tty')

var params = false
if(fs.existsSync(`.params`)) params = JSON.parse( fs.readFileSync(`.params`) )

const commandLineArgs = require('command-line-args')
const options = commandLineArgs([
	{ name: 'stats', alias: 's', type: Boolean, defaultValue: false },
	{ name: 'subunits', alias: 'j', type: String, defaultValue: params ? params.subunits : "subunits.json" },
	{ name: 'number', alias: 'n', type: Number, defaultValue: 100 },
	{ name: 'range', alias: 'r', type: Number, defaultValue: 0 }
])

const delimiter = "__"
const sourceFolder = "smiles"
const outputFolder = "mol2"
const statsOnly = options.stats

console.log("\nLoading smiles files for sorting")
const sourceFilenames = fs.readdirSync(sourceFolder)
const numOfFiles = sourceFilenames.length

const number = Math.min(options.number, sourceFilenames.length)
const range = options.range ? Math.max(options.range, options.number) : options.number

const defaultJSONPath = require('../subunits-path')
const jsonPath = fs.existsSync(options.subunits) ? options.subunits : defaultJSONPath
const subunitsString = fs.readFileSync(jsonPath)
const subunits = JSON.parse(subunitsString)

// create a new progress bar instance
const ProgressBar = require('progress')
const filterBar = new ProgressBar(
	'Progress :bar :percent :current/:total smiles sorted ',
	{ total: sourceFilenames.length, incomplete: '░', complete: '█', renderThrottle: 200 }
)

const obabelBar = new ProgressBar(
	'Progress :bar :percent :current/:total smiles processed ',
	{ total: number, incomplete: '░', complete: '█', renderThrottle: 200 }
)

module.exports = {
	number,
	range,
	sourceFolder,
	sourceFilenames,
	numOfFiles,
	outputFolder,
	subunits,
	delimiter,
	filterBar,
	obabelBar,
	statsOnly
}
