const {conserved, subunitsHash } = require('./config')

module.exports = function(i){
	let index = -1
	if(conserved[i]) {
		let c = conserved[i]
		if(subunitsHash.hasOwnProperty(c))
			index = subunitsHash[c].index
		else
			console.log(`You have specified to conserve ${c} at position ${i+1} but no source subunit was found to match '${c}', using random subunit instead`)
	}
	return index
}
