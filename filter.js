#!/usr/bin/env node

const fs = require('fs-extra')
const { spawnSync } = require('child_process')

global.db = require('better-sqlite3')('smiles.sqlite')
// add exit hook for closing db
const exitHook = require('exit-hook')
exitHook(() => {
	db.close()
})

const startTime = Date.now()

const {
	sourceFolder, sourceFilenames, numOfFiles, outputFolder, delimiter,
	filterBar, obabelBar, number, range, subunits, statsOnly,
	props, propsMax, propsMin
} = require('./utils/filter/config')

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



// score the props for each one
const paginatedQuery = db.prepare(
	`SELECT *
	FROM smiles
	WHERE score IS NULL
	ORDER BY id
	LIMIT 1000`
)
const scoreUpdate = db.prepare(`UPDATE smiles SET score = ? WHERE id = ?`)

var results = paginatedQuery.all(),
	file, totalProcessed = 0

while(results && results.length)//function scoreFunc()
{
	for(i = 0; i < results.length; i++){
		file = results[i]
		file.score = 0
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

		scoreUpdate.run(file.score, file.id)

		totalProcessed++

	}

	filterBar.update( (totalProcessed/numOfFiles) )

	results = paginatedQuery.all()
}

// finish off the filterBar
if(filterBar.curr != filterBar.total) filterBar.update(1)


// get range ids based on score
var filtered
if(range == number)
	filtered = db.prepare(`SELECT * FROM smiles ORDER BY score DESC LIMIT ${number}`).all()
else {
	filtered = db.prepare(
		`SELECT * FROM smiles WHERE id IN
		(SELECT id FROM smiles ORDER BY score DESC LIMIT ${range})
		ORDER BY RANDOM() LIMIT ${number}`)
		.all()
}

// generate stats
console.log(`\nSorted ${numOfFiles} smiles, generating stats`)

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
	fileStats += "\n" + (i+1) + "," +filtered[i].name
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
	console.log(`\nConverting ${number} from the top ${range} to mol2\n`)
	fs.ensureDirSync(outputFolder)
	const wip = "00.UNCONVERTED."

	obabelBar.update(0)

	for(i = 0; i < number; i++)
	{
		filename = filtered[i].name
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
