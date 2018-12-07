module.exports = function(cmd){
	if(!process.stderr.isTTY){
		const tty = require('tty').WriteStream.prototype;
		for(var key in tty){
			process.stderr[key] = tty[key]
		}
		process.stderr.columns = 80
	}
}
