const startTime = Date.now()

const {sourceFolder, sourceFilenames, conserved, delimiter, bar,
	subunitShortNames, subunitCIDs} = require('./utils/filter/config')

bar.start(sourceFilenames.length, 0, {matches: 0})

const results = []

for(var i = 0; i<sourceFilenames.length; i++){

	var filename = sourceFilenames[i],
		filenameSubunits = filename.replace(/^(cyclic|linear)\.\d+\./, "").replace(/\.smiles$/, ""),
		filenameSplit = filenameSubunits.split(delimiter),
		weight = 0, charge = 0

	for(var k = 0; k<filenameSplit.length; k++){

		var subunitShortName = filenameSplit[k],
			subunit = subunitShortNames[subunitShortName]

		charge += subunit.charge
		weight += subunit.weight
	}

	if(weight < 800) results.push(filename)

	bar.update(i, {matches: results.length})
}

bar.update(sourceFilenames.length)
bar.stop()

console.log(`Found ${results.length} files that match your filter`)

const endTime = Date.now()
const duration = (endTime - startTime)/1000
const used = process.memoryUsage().heapUsed / 1024 / 1024
console.log(`The script took ${duration}s and used approximately ${Math.round(used * 100) / 100} MB memory`)
