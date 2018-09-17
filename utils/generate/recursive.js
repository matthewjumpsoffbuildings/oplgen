//------------------------------------------------------
// NECKLACES, LYNDON WORDS, and RELATIVES
// Programmed by: Joe Sawada 2010-2014
//------------------------------------------------------

const startTime = Date.now()

const {numOfSequences, sequenceLength, subunitsLength, bar, subunits,
	sequenceType, subunitNames, delimiter} = require('./config')

const MAX = 99
const TRUE = 1
const FALSE = 0

// typedef struct cell {
// 	int next,prev;
// } cell;
//
// typedef struct element {
//     int s, v;
// } element;

//-------------------------------------------------------------
// GLOBAL VARIABLES
//-------------------------------------------------------------
let N = sequenceLength, K = subunitsLength, D,M,type,head,total=0,NECK=0, LYN=1;
let UNRESTRICTED=0,DENSITY=0,CONTENT=0,FORBIDDEN=0,BRACELET=1,UNLABELED=0,CHORD=0,LIE=0,CHARM=0,DB=0;
let a=[], p=[], b=[], f=[], fail=[], num=[], run=[], num_map=[], charm=[];
let avail=[];
let nb = 0; // number of blocks
let B=[]; // run length encoding data structure
let PRIME=[]; // relatively prime array for charm bracelets


//-------------------------------------------------------------
//-------------------------------------------------------------
function Print() {
	total++
	sequences++
	iterations++
	bar.update(sequences)

	let sequenceString = "",
		filename = sequenceType+"."+sequenceLength+"."

	// generate output string and filename
	for (var i = 1; i < sequenceLength; i++){
		sequenceString += subunits[indexes[i]]
		filename += subunitNames[indexes[i]].split(delimiter)[0]
		if(i<sequenceLength-1) filename += delimiter
	}

	// add terminator
	sequenceString += "O"
}


/*------------------------------------------------------------*/
// SUBROUTINES
/*------------------------------------------------------------*/
/*------------------------------------------------------------*/
// return -1 if reverse smaller
// return 0 if reverse larger
// return 1 if equal
/*------------------------------------------------------------*/
function CheckRev( t, i ) {
	for (let j=i+1; j<=(t+1)/2; j++) {
		if      (a[j] < a[t-j+1]) return(0);
		else if (a[j] > a[t-j+1]) return(-1);
	}
	return(1);
}

/*-----------------------------------------------------------*/
// BRACELETS
/*-----------------------------------------------------------*/
function GenB( t, p, r, u, v, RS ) {
	if(sequences >= numOfSequences) return

	var j, rev;

	if (t-1 > (N-r)/2 + r) {
		if (a[t-1] > a[N-t+2+r]) RS = FALSE;
		else if (a[t-1] < a[N-t+2+r]) RS = TRUE;
	}

	if (t > N)  {
		if ((RS == FALSE) && ((NECK && N%p == 0) || (LYN && N==p)))
			Print();
	}
	else {
		a[t] = a[t-p];

		if (a[t] == a[1]) v++;
		else v = 0;

		if ((u == -1) && (a[t-1] != a[1])) u = r = t-2;

		if ((u != -1) && (t == N) && (a[N] == a[1])) {}
		else if (u == v) {
			rev = CheckRev(t, u);
			if (rev == 0) GenB(t+1,p,r,u,v,RS);
			if (rev == 1) GenB(t+1,p,t,u,v,FALSE);
		}
		else GenB(t+1,p,r,u,v,RS);

		for (j = a[t-p]+1; j <= K-1; j++) {
			a[t] = j;
			GenB(t+1,t,r,u,0,RS);
		}
	}
}

/*------------------------------------------------------------*/
/*------------------------------------------------------------*/
module.exports = function() {

	a = [0]//a[1] = 0;

	GenB(1,1,1,1,1,FALSE);
}
//--------------------------------------------------------------------------------
