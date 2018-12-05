#!/usr/bin/env node

const startTime = Date.now()

const {
	sourceFolder, sourceFilenames, outputFolder, delimiter, bar, number, range, subunits
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
	score, val


// calculate the props for each one
for(i = 0; i<sourceFilenames.length; i++){

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

	if(i % 2) bar.tick()
}

// score the props for each one
for(i = 0; i<sourceFilenames.length; i++){
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

	if(i % 2) bar.tick()
}

bar.update(1)


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


// convert to mol2
console.log(`\nSorted ${sourceFilenames.length} smiles, converting to mol2`)
const fs = require('fs-extra')
const { execSync } = require('child_process')
fs.ensureDirSync(outputFolder)
const wip = "00.UNCONVERTED."

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

	console.log(`\nconverting to mol2 - ${i+1}/${number}`)

	// step 1 of obabel
	console.log(`\n${filename} - obabel step 1`)
	execSync(`obabel -ismi ${sourceFolder}/${filename}.smiles -osy2 -O ${outputFolder}/${wip}${k}${filename}.mol2 --gen3d --partialcharge`)

	// step 2 of obabel
	console.log(`${filename} - obabel step 2`)
	execSync(`obabel -isy2 ${outputFolder}/${wip}${k}${filename}.mol2 -osy2 -O ${outputFolder}/${k}${filename}.mol2 -p 7 --minimize --conformer`)
	fs.unlinkSync(`${outputFolder}/${wip}${k}${filename}.mol2`)
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



// done
const endTime = Date.now()
const duration = (endTime - startTime)/1000
const used = process.memoryUsage().heapUsed / 1024 / 1024
console.log(`\n\nDone! Created output.mol2 with ${totalOutputs} items, ready for dock6`)
console.log(`\nThe script took ${duration}s and used approximately ${Math.round(used * 100) / 100} MB memory`)
