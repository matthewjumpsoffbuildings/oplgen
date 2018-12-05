/*
	quick dirty script to convert a bunch of text files each containing a single SMILES and properties, into a subunits.json file
	example:

	N[C@@H](C[C@@H]1CC[C@H](C=C1)O)C(=O)

	miLogP         -0.77
	TPSA           98.65
	natoms         24
	MW             334.42
	nON            6
	nOHNH          4
	nviolations    0
	nrotb          4
	volume         315.53
*/

const fs = require('fs')

const files = fs.readdirSync('subunits')

var json = {}

for(var i in files){
	var name = files[i].split('.')[0].toUpperCase().replace("(", "").replace(")", "")
	var props = {}

	var text = fs.readFileSync('subunits/'+files[i]).toString()

	text = text.split('\n')
	for(var n = 0; n<11; n++)
	{
		var line = text[n].trim()

		if(n == 0) {
			props.smiles = line
			continue
		}

		var found = line.match(/([A-Za-z]*) *([0-9\.\-]*)/)
		if(found[1] == "" || found[1] == "nviolations") continue // ignore nviolations and blank lines
		props[ found[1] ] = Number(found[2])/2
	}

	json[name] = props
}

fs.writeFileSync('subunits.json', JSON.stringify(json, null, 2))
