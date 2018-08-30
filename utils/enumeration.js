const phi = require('number-theory').eulerPhi
const divisors = require('number-theory').divisors
const sum = (arr, func) => arr.reduce( (acc, n) => acc + func(n), 0)

module.exports = function(n, k){
	let divisorsArray = divisors(n),
		necklaces = (1/n) * sum(divisorsArray, (d) => phi(d) * k ** (n/d))

	return (n % 2) ?
		(necklaces/2) + 0.5 * (k ** ((n+1)/2)) :
		(necklaces/2) + 0.25 * (k+1) * (k ** (n/2))
}
