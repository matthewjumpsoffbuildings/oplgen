const {conserved, subunitCIDs, subunitShortNames} = require('./config')

module.exports = function(i){
	let index = -1
	if(conserved[i]) {
		let c = conserved[i]
		if(subunitShortNames.hasOwnProperty(c))
			index = subunitShortNames[c]
		else
			console.log(`You have specified to conserve ${c} at position ${i+1} but no source subunit was found to match '${c}', using random subunit instead`)
	}
	return index
}
