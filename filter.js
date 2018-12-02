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
		data = Object.assign({ score: 0, filename: filename }, props)

	for(var k = 0; k<filenameSplit.length; k++){

		var subunit = subunits[filenameSplit[k]]

		for(var prop in props){
			data[prop] += subunit[prop]/2
		}
	}

	for(var prop in props){
		if(!propsMax.hasOwnProperty(prop) || propsMax[prop] < data[prop]) propsMax[prop] = data[prop]
		if(!propsMin.hasOwnProperty(prop) || propsMin[prop] > data[prop]) propsMin[prop] = data[prop]
	}

	sourceFilenames[i] = data

	bar.update(i/2)
}


for(var i = 0; i<sourceFilenames.length; i++){
	var file = sourceFilenames[i],
		filename = file.filename

	for(var prop in props){
		var score = 0,
			val = file[prop]

		if(prop == "miLogP") {
			if(val >= 1 && val <= 3)
				score = 1.5 // optimal range
			else if(val >= -4 && val <= 5)
				score = 0.5 // suboptimal range
			else
				score = 0 // out of range
		}
		else // everything but logP
			score = (propsMax[prop] - val)  / (propsMax[prop] - propsMin[prop])

		// make the lipinksi props more important
		if(prop == "MW" || prop == "nON" || prop == "nOHNH")
			score *= 1.5

		file.score += score
		file[prop+"_score"] = score
		file[prop+"_min"] = propsMin[prop]
		file[prop+"_max"] = propsMax[prop]
	}

	bar.update((sourceFilenames.length/2)+i/2)
}


sourceFilenames.sort(function(a, b){
	return b.score - a.score
})

bar.update(sourceFilenames.length)
bar.stop()


// console.log(sourceFilenames.slice(0, 10))


const endTime = Date.now()
const duration = (endTime - startTime)/1000
const used = process.memoryUsage().heapUsed / 1024 / 1024
console.log(`The script took ${duration}s and used approximately ${Math.round(used * 100) / 100} MB memory`)
