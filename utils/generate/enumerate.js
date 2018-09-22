const phi = require('number-theory').eulerPhi
const divisors = require('number-theory').divisors
const sum = (arr, func) => arr.reduce( (acc, n) => acc + func(n), 0)

function enumerate(n, k, c){

	let divisorsArray = divisors(n),
		necklaces = (1/n) * sum(divisorsArray, (d) => phi(d) * k ** (n/d))

	// let bracelets = (n % 2) ?
	// 	(necklaces/2) + 0.5 * (k ** ((n+1)/2)) :
	// 	(necklaces/2) + 0.25 * (k+1) * (k ** (n/2))

	return necklaces
}

module.exports = enumerate
