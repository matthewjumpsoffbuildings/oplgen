const startTime = Date.now()

const {sourceFolder, sourceFilenames, conserved, delimiter, bar,
	subunits} = require('./utils/filter/config')

bar.start(sourceFilenames.length, 0, {matches: 0})

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

for(var i = 0; i<sourceFilenames.length; i++){

	var filename = sourceFilenames[i],
		filenameSubunits = filename.replace(/^(cyclic|linear)\.\d+\./, "").replace(/\.smiles$/, ""),
		filenameSplit = filenameSubunits.split(delimiter),
		data = Object.assign({ score: 0 }, props)

	for(var k = 0; k<filenameSplit.length; k++){

		var subunit = subunits[filenameSplit[k]]

		for(var prop in props){
			data[prop] += subunit[prop]
		}
	}

	for(var prop in props){
		if(!propsMax.hasOwnProperty(prop) || propsMax[prop] < data[prop]) propsMax[prop] = data[prop]
		if(!propsMin.hasOwnProperty(prop) || propsMin[prop] > data[prop]) propsMin[prop] = data[prop]
	}
	// console.log(data)
}

console.log(propsMin)
console.log(propsMax)

bar.update(sourceFilenames.length)
bar.stop()

// console.log(`Found ${results.length} files that match your filter`)

const endTime = Date.now()
const duration = (endTime - startTime)/1000
const used = process.memoryUsage().heapUsed / 1024 / 1024
console.log(`The script took ${duration}s and used approximately ${Math.round(used * 100) / 100} MB memory`)
