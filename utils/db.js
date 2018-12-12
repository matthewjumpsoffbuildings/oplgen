const props = require('./props')
const sqlite = require('better-sqlite3')
const db = sqlite('smiles.sqlite')

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

db.close()


// // add exit hook for closing db
// const exitHook = require('exit-hook')
// exitHook(() => { db.close() })

// const countSQL = db.prepare(`SELECT count(id) FROM smiles`)
// const insertSQL = db.prepare(`INSERT or IGNORE INTO smiles (${Object.keys(props).join(", ")}) VALUES (@${Object.keys(props).join(", @")})`);
// const insertTransation = db.transaction((smiles) => {
// 	for (const s of smiles) insertSQL.run(s)
// })


// class BufferedWriter {
// 	constructor() {
// 		this.data = []
// 	}
// 	add(data) {
// 		this.data = this.data.concat(data)
// 		if(this.data.length >= WRITE_BLOCK){
// 			console.log("db write", process.memoryUsage().rss / 1024 / 1024)
// 			var oldCount = countSQL.get()["count(id)"]
// 			insertTransation(this.data)
// 			var newCount = countSQL.get()["count(id)"]
// 			this.data = []
// 			process.send({newSequences: newCount - oldCount })
// 			console.log("db write done", process.memoryUsage().rss / 1024 / 1024)
// 		}
// 	}
// }

// var bufferedWriter = new BufferedWriter()


// process.on('message', function(message) {
// 	if(message.data){
// 		console.log("db data received", process.memoryUsage().rss / 1024 / 1024)
// 		bufferedWriter.add(message.data)
// 	}
// })
