const props = require('./props')
const db = require('better-sqlite3')('smiles.sqlite')

const WRITE_BLOCK = 20000// Math.max(1000, Math.min(20000, numOfSequences/10))

db.prepare(
	`CREATE TABLE IF NOT EXISTS smiles(
		id INTEGER PRIMARY KEY,
		name TEXT UNIQUE,
		smiles TEXT,
		score DOUBLE,
		miLogP DOUBLE,
		TPSA DOUBLE,
		natoms DOUBLE,
		MW DOUBLE,
		nON DOUBLE,
		nOHNH DOUBLE,
		nrotb DOUBLE,
		volume DOUBLE
	)`).run()
db.prepare(
	`CREATE TABLE IF NOT EXISTS history(
		id INTEGER PRIMARY KEY CHECK (id = 0),
		last_gen INTEGER NOT NULL DEFAULT CURRENT_TIMESTAMP
	)`).run()
db.prepare(`INSERT OR IGNORE INTO history VALUES (0, CURRENT_TIMESTAMP)`).run()
db.prepare(`UPDATE history SET last_gen = CURRENT_TIMESTAMP`).run()


// add exit hook for closing db
const exitHook = require('exit-hook')
exitHook(() => {
	db.close()
})

const countSQL = db.prepare(`SELECT count(id) FROM smiles`)
const insertSQL = db.prepare(`INSERT or IGNORE INTO smiles (${Object.keys(props).join(", ")}) VALUES (@${Object.keys(props).join(", @")})`);
const insertTransation = db.transaction((smiles) => {
	for (const s of smiles) insertSQL.run(s)
})


class BufferedWriter {
	constructor() {
		this.data = []
	}
	add(data) {
		this.data = this.data.concat(data)
		if(this.data.length >= WRITE_BLOCK){
			var oldCount = countSQL.get()["count(id)"]
			insertTransation(this.data)
			var newCount = countSQL.get()["count(id)"]
			process.send({newSequences: newCount - oldCount })
			this.data = []
			return true
		}
		return false
	}
}

var bufferedWriter = new BufferedWriter()


process.on('message', function(message) {
	if(message.data){
		var result = bufferedWriter.add(message.data)
		if(result){
			bufferedWriter = new BufferedWriter()
		}
		message.data = null
		console.log("db", process.memoryUsage().rss / 1024 / 1024)
	}
})
