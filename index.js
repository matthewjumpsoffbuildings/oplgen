const sequencesNeeded = 10000
const sequenceLengthNeeded = 6

const subunits = [
	"AAA",
	"BBB",
	"CCC",
	"DDD",
	"EEE",
	"FFF",
	"GGG"
]

const sequencesHash = {}
const sequences = []

while(sequences.length < sequencesNeeded){

	let sequenceIndexArray = [],
		sequenceIndexString = "",
		sequenceString = ""

	// generate a new random sequence
	for(var i = 0; i<sequenceLengthNeeded; i++){
		let subunitIndex = Math.floor(Math.random()*subunits.length),
			subunitString = subunits[subunitIndex]

		sequenceString += subunitString
		sequenceIndexArray.push(subunitIndex)
	}

	// check this new sequence hasnt been made already
	sequenceIndexString = sequenceIndexArray.join(",")
	if(sequencesHash.hasOwnProperty(sequenceIndexString)){
		console.log(sequenceIndexString, "already exists")
		continue
	}

	// this sequence is new, store all variations in the sequencesHash so it doesnt get repeated
	for(i = 0; i <sequenceLengthNeeded; i++){
		sequenceIndexArray.unshift(sequenceIndexArray.pop())
		sequenceIndexString = sequenceIndexArray.join(",")
		sequencesHash[sequenceIndexString] = true
	}

	// add 1s to make closed loop
	sequenceString += "1"
	sequenceString = sequenceString.substr(0, 1) + "1" + sequenceString.substr(1)

	sequences.push(sequenceString)

}

console.log(sequences)
