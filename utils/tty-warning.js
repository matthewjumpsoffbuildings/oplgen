module.exports = function(cmd){
	if(!process.stderr.isTTY){
		var ttyMessage = "---- WARNING ---"
		ttyMessage += "\nYou are running this command in non TTY shell."
		ttyMessage += "\nThis means the progress bar wont display. The program is still running."
		ttyMessage += "\nIf you want to see a progress bar, cancel (CTRL-C), and try running in a different shell"

		if (process.platform == 'win32') {
			ttyMessage += "\n\nOr you can try running the command like this instead:"
			ttyMessage += "\n\nwinpty "+cmd+" "+process.argv.slice(2).join(" ")+"\n"
		}

		console.log(ttyMessage)
	}
}
