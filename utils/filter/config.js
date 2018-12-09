const fs = require('fs-extra')
const path = require('path')
require('../tty')

var params = false
if(fs.existsSync(`.params`)) params = JSON.parse( fs.readFileSync(`.params`) )

const commandLineArgs = require('command-line-args')
const options = commandLineArgs([
	{ name: 'stats', alias: 's', type: Boolean, defaultValue: false },
	{ name: 'subunits', alias: 'j', type: String, defaultValue: params ? params.subunits : "subunits.json" },
	{ name: 'number', alias: 'n', type: Number, defaultValue: 100 }, // 0 = all
	{ name: 'range', alias: 'r', type: Number, defaultValue: -1 } // -1 = same as number, 0 = all
])

const delimiter = "__"
const sourceFolder = "smiles"
const outputFolder = "mol2"
const statsOnly = options.stats

const props = {
	miLogP: 0,
	TPSA: 0,
	natoms: 0,
	MW: 0,
	nON: 0,
	nOHNH: 0,
	nrotb: 0,
	volume: 0
}

// get max and min from db
console.log(`\nGetting max/min values from the database\n`)
const propsMax = {}
const propsMin = {}
for(var prop in props){
	process.stdout.write(`${prop} -`)
	propsMax[prop] = db.prepare(`SELECT max(${prop}) from smiles`).get()[`max(${prop})`]
	process.stdout.write(` max:${propsMax[prop]},`)
	propsMin[prop] = db.prepare(`SELECT min(${prop}) from smiles`).get()[`min(${prop})`]
	process.stdout.write(` min:${propsMin[prop]}, `)
}
console.log('')

const numOfFiles = db.prepare('SELECT count(*) from smiles').get()['count(*)']
const number = options.number > 0 ? Math.min(options.number, numOfFiles) : numOfFiles
const range = options.range > 0 ? Math.max(options.range, number) : (options.range == 0 ? numOfFiles : number)

const defaultJSONPath = require('../subunits-path')
const jsonPath = fs.existsSync(options.subunits) ? options.subunits : defaultJSONPath
const subunitsString = fs.readFileSync(jsonPath)
const subunits = JSON.parse(subunitsString)

// create a new progress bar instance
const ProgressBar = require('progress')
const filterBar = new ProgressBar(
	'Progress :bar :percent :current/:total smiles scored ',
	{ total: numOfFiles, incomplete: '░', complete: '█', renderThrottle: 200 }
)

const obabelBar = new ProgressBar(
	'Progress :bar :percent :current/:total smiles converted ',
	{ total: number, incomplete: '░', complete: '█', renderThrottle: 200 }
)

module.exports = {
	number,
	range,
	numOfFiles,
	outputFolder,
	subunits,
	delimiter,
	filterBar,
	obabelBar,
	statsOnly,
	props,
	propsMax,
	propsMin
}
