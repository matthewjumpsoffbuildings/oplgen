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
		if(found[1] == "" || found[1] == "nviolations") continue
		props[ found[1] ] = Number(found[2])/2
	}

	json[name] = props
}

fs.writeFileSync('subunits.json', JSON.stringify(json, null, 2))
