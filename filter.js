#!/usr/bin/env node

const fs = require('fs-extra')
const { spawnSync } = require('child_process')

const startTime = Date.now()

const {
	sourceFolder, sourceFilenames, numOfFiles, outputFolder, delimiter, filterBar, obabelBar, number, range, subunits, statsOnly
} = require('./utils/filter/config')

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
const propsMax = {}
const propsMin = {}

var file,
	filename,
	filenameSubunits,
	filenameSplit,
	data,
	subunit,
	i, k, prop,
	score, val,
	spawn, spawnStdErr

console.log(`\nSorting ${numOfFiles} smiles files, selecting ${number} from the top ${range}\n`)

filterBar.update(0)

// calculate the props for each one
for(i = 0; i<numOfFiles; i++){

	filename = sourceFilenames[i]
	filenameSubunits = filename.replace(/^(cyclo|linear)\.\d+\./, "").replace(/\.smiles$/, "")
	filenameSplit = filenameSubunits.split(delimiter)
	data = Object.assign({ score: 0, filename: filename }, props)

	for(k = 0; k<filenameSplit.length; k++){

		subunit = subunits[filenameSplit[k]]

		for(prop in props){
			data[prop] += subunit[prop]
		}
	}

	for(prop in props){
		if(!propsMax.hasOwnProperty(prop) || propsMax[prop] < data[prop]) propsMax[prop] = data[prop]
		if(!propsMin.hasOwnProperty(prop) || propsMin[prop] > data[prop]) propsMin[prop] = data[prop]
	}

	sourceFilenames[i] = data

	if(i % 1000 == 0) filterBar.update( (i/numOfFiles)*.5 )
}

// score the props for each one
for(i = 0; i<numOfFiles; i++){
	file = sourceFilenames[i]
	filename = file.filename

	for(prop in props){
		score = 0,
		val = file[prop]

		if(prop == "miLogP") {
			if(val >= 1 && val <= 3)
				score = 1.5 // optimal range
			else if(val >= -4 && val <= 5)
				score = 1 // suboptimal range
			else
				score = 0 // out of range
		}
		else // everything but logP
			score = (propsMax[prop] - val)  / (propsMax[prop] - propsMin[prop])

		// make the lipinksi props more important
		if(prop == "MW" || prop == "nON" || prop == "nOHNH")
			score *= 1.5

		file.score += score
	}

	if(i % 1000 == 0) filterBar.update( (i/numOfFiles)*.5+.5 )
}

// finish off the filterBar
if(filterBar.curr != filterBar.total) filterBar.update(1)


// sort based on score
sourceFilenames.sort(function(a, b){
	return b.score - a.score
})

// get filtered results
const _ = require('underscore')
const rangeArray = sourceFilenames.splice(0, range)
const filtered = rangeArray.length > number ? _.sample(rangeArray, number) : rangeArray

// sort filtered again based on score
filtered.sort(function(a, b){
	return b.score - a.score
})

// generate stats
const stats = require('stats-lite')
const vals = {}, max = {}, min = {}
const filterInfo = `${number} selected from top scoring ${range} of ${numOfFiles} total  -  oplflt ${process.argv.slice(2).join(" ")}`
var fileStats = filterInfo
fileStats += "\n\nRANK,FILENAME"

props.score = 0
for(prop in props){
	vals[prop] = []
	fileStats += "," + prop
}
for(i = 0; i<number; i++){
	fileStats += "\n" + (i+1) + "," +filtered[i].filename.replace(".smiles", "")
	for(prop in props){
		val = filtered[i][prop]
		vals[prop].push(val)
		if(!max.hasOwnProperty(prop) || max[prop] < val) max[prop] = val
		if(!min.hasOwnProperty(prop) || min[prop] > val) min[prop] = val
		fileStats += "," + filtered[i][prop]
	}
}

var outputStats = filterInfo
outputStats += "\n\nPROPERTY,MIN,MAX,MEAN,MEDIAN,STANDARD DEVIATION,SAMPLE STANDARD DEVIATION"

for(prop in props){
	outputStats += "\n" + prop
	outputStats += "," + min[prop]
	outputStats += "," + max[prop]
	outputStats += "," + stats.mean(vals[prop])
	outputStats += "," + stats.median(vals[prop])
	outputStats += "," + stats.stdev(vals[prop])
	outputStats += "," + stats.sampleStdev(vals[prop])
}

outputStats += "\n\n----------------------------------\n\n\n"
fileStats	+= "\n\n----------------------------------\n\n\n"

fs.appendFileSync(`stats-totals.txt`, outputStats)
fs.appendFileSync(`stats-files.txt`, fileStats)


// convert to mol2
// unless statsOnly was passed
if(!statsOnly)
{
	console.log(`\nSorted ${numOfFiles} smiles, converting ${number} from the top ${range} to mol2\n`)
	fs.ensureDirSync(outputFolder)
	const wip = "00.UNCONVERTED."

	obabelBar.update(0)

	for(i = 0; i < number; i++)
	{
		filename = filtered[i].filename.replace(".smiles", "")
		k = ""
		// k = padString+(i+1)
		// k = k.substr(k.length-padStringLength)

		// check if this smiles isnt partially converted
		if(fs.existsSync(`${outputFolder}/${wip}${k}${filename}.mol2`)){
			fs.unlinkSync(`${outputFolder}/${wip}${k}${filename}.mol2`)
			if(fs.existsSync(`${outputFolder}/${k}${filename}.mol2`))
				fs.unlinkSync(`${outputFolder}/${k}${filename}.mol2`)
		} // otherwise its already converted, move on
		else if(fs.existsSync(`${outputFolder}/${k}${filename}.mol2`))
			continue

		// step 1 of obabel
		spawn = spawnSync(`obabel`, [`-ismi`, `${sourceFolder}/${filename}.smiles`, `-osy2`, `-O`, `${outputFolder}/${wip}${k}${filename}.mol2`, `--gen3d`, `--partialcharge`])

		// log errors here if needed
		spawnStdErr = spawn.stderr.toString()
		if(spawnStdErr && spawnStdErr.search(/error/i) > -1) {
			console.log(`\n${spawnStdErr}\nFile: ${filtered[i].filename}\nThere may be an issue with one of the subunit smiles\nSkipping this file for now`)
			// delete wip file and move on
			fs.unlinkSync(`${outputFolder}/${wip}${k}${filename}.mol2`)
			continue
		}

		// step 2 of obabel
		spawn = spawnSync(`obabel`, [`-isy2`, `${outputFolder}/${wip}${k}${filename}.mol2`, `-osy2`, `-O`, `${outputFolder}/${k}${filename}.mol2`, `-p`, `7`, `--minimize`, `--conformer`])

		// delete wip file
		fs.unlinkSync(`${outputFolder}/${wip}${k}${filename}.mol2`)

		obabelBar.update((i+1)/number)
	}

	// combine all mol2 files into one big output mol2
	const outputFilenames = fs.readdirSync(outputFolder)
	if(fs.existsSync(`output.mol2`)) fs.unlinkSync(`output.mol2`)
	var totalOutputs = 0
	for(i = 0; i < outputFilenames.length; i++)
	{
		filename = outputFilenames[i]
		if(!fs.existsSync(`${outputFolder}/${filename}`)) continue

		if(filename.indexOf(wip) === 0){
			fs.unlinkSync(`${outputFolder}/${filename}`)
			filename = filename.replace(wip, "")
			if(fs.existsSync(`${outputFolder}/${filename}`))
				fs.unlinkSync(`${outputFolder}/${filename}`)
			continue
		}

		k = fs.readFileSync(`${outputFolder}/${filename}`)
		fs.appendFileSync(`output.mol2`, k)
		totalOutputs++
	}

	// finish off progress bar for mol2 conversion
	if(obabelBar.curr != number) obabelBar.update(1)
} // (end of !statsOnly) block



// done
const endTime = Date.now()
const duration = (endTime - startTime)/1000
const used = process.memoryUsage().heapUsed / 1024 / 1024

if(statsOnly)
	console.log(`\n\nDone! Created stats for ${number} items`)
else
	console.log(`\n\nDone! Created output.mol2 with ${totalOutputs} items, ready for dock6`)

console.log(`\nThe script took ${duration}s and used approximately ${Math.round(used * 100) / 100} MB memory`)
