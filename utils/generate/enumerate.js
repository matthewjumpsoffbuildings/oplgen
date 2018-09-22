const phi = require('number-theory').eulerPhi
const divisors = require('number-theory').divisors
const sum = (arr, func) => arr.reduce( (acc, n) => acc + func(n), 0)

function enumerate(n, k, c){

	let divisorsArray = divisors(n),
		necklaces = (1/n) * sum(divisorsArray, (d) => phi(d) * k ** (n/d))
	
	return necklaces
}

module.exports = enumerate
