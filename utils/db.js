const props = require('./props')
const db = require('better-sqlite3')('smiles.sqlite')

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

process.on('message', function(message) {
	if(message.exit) process.exit()

	if(message.data){
		var oldCount = countSQL.get()["count(id)"]
		insertTransation(message.data)
		var newCount = countSQL.get()["count(id)"]
		process.send({newSequences: newCount - oldCount })
		message.data = null
	}

	message = null
})
