#!/usr/bin/env node

const fs = require('fs-extra')

const dockedPath = process.argv[2] ? process.argv[2] : 'docked.mol2'
var dockedString = false

if(fs.existsSync(dockedPath)){
	dockedString = fs.readFileSync(dockedPath).toString()
} else {
	console.log(`No mol2 file found at ${dockedPath}`)
	process.exit()
}

const props = {
	Grid_Score:[],
	Grid_vdw_energy:[],
	Grid_es_energy:[],
	Internal_energy_repulsive:[]
}
const max = {}
const min = {}

const regex = /[#]+[ \t]+(Grid_Score|Grid_vdw_energy|Grid_es_energy|Internal_energy_repulsive):[ \t]+([\d-.]+)/g

var matches, prop, val
while (matches = regex.exec(dockedString)) {
	prop = matches[1]
	val = Number(matches[2])
	props[prop].push(val)
	if(!max.hasOwnProperty(prop) || max[prop] < val) max[prop] = val
	if(!min.hasOwnProperty(prop) || min[prop] > val) min[prop] = val
}

const stats = require('stats-lite')
var outputStats = "PROPERTY,MIN,MAX,MEAN,MEDIAN,STANDARD DEVIATION,SAMPLE STANDARD DEVIATION"

for(prop in props){
	outputStats += "\n" + prop
	outputStats += "," + min[prop]
	outputStats += "," + max[prop]
	outputStats += "," + stats.mean(props[prop])
	outputStats += "," + stats.median(props[prop])
	outputStats += "," + stats.stdev(props[prop])
	outputStats += "," + stats.sampleStdev(props[prop])
}

outputStats += "\n\n----------------------------------\n\n\n"

fs.appendFileSync(`dock-stats.txt`, outputStats)
