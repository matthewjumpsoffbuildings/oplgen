module.exports = function(cmd){
	var ttyMessage = false

	if(1 || !process.stderr.isTTY){
		ttyMessage = "You are running this command in non TTY mode."
		ttyMessage += "\nThis means the progress bar wont display. The program is still running."

		if (1 || process.platform == 'win32') {
			ttyMessage += "\n\nIf you want to see a progress bar, cancel (CTRL-C), and try running this:"
			ttyMessage += "\nwinpty "+cmd+" "+process.argv.slice(2).join(" ")
		}
	}

	return ttyMessage
}
