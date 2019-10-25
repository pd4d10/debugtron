var childProcess = require('child_process')

module.exports = function(options) {
	options = options || {}

	return function execFile() {

		var child = childProcess.execFile.apply(childProcess, arguments)

		if (!options.bufferStdout) {
			child.stdout.removeAllListeners('data')
		}

		if (!options.bufferStderr) {
			child.stderr.removeAllListeners('data')
		}

		return child
	}
}
