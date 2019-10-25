var fs = require('fs')
var util = require('util')
var childProcess = require('child_process')
var path = require('path')
var debug = require('debug')('regedit')
var errors = require('./errors.js')
var os = require('os')
var StreamSlicer = require('stream-slicer')
var through2 = require('through2')
var helper = require('./lib/helper.js')
var execFile = require('./lib/execFile.js')()
var cscript = require('./lib/cscript.js')

/*
 * 	Access the registry without using a specific os architecture, this means that on a 32bit process on a 64bit machine
 * 	when we access hklm\software we will actually be accessing hklm\software\wow6432node.
 */
var OS_ARCH_AGNOSTIC = 'A'

/*
 * 	Access the registry using a specific os architecture, but determine what the architecture is automatically
 * 	This means that accessing in order to access the 32bit software registry on a 64bit machine we will need to
 * 	use the key hklm\software\wow6432node
 */
var OS_ARCH_SPECIFIC = 'S'

/*
 * 	Access the registry using 32bit os architecture
 */
var OS_ARCH_32BIT = '32'

/*
 * 	Access the registry using 64bit os architecture, this will have no effect on 32bit process/machines
 */
var OS_ARCH_64BIT = '64'

/*
 * 	If this value is set the module will change directory of the VBS to the appropriate location instead of the local VBS folder
 */
var externalVBSFolderLocation

module.exports.setExternalVBSLocation = function(newLocation) {
	if (fs.existsSync(newLocation)) {
		externalVBSFolderLocation = newLocation
		return 'Folder found and set'
	}

	return 'Folder not found'
}

module.exports.list = function(keys, architecture, callback) {
	//console.log('list with callback will be deprecated in future versions, use list streaming interface')

	if (architecture === undefined) {
		callback = undefined
		architecture = OS_ARCH_AGNOSTIC
	} else if (typeof architecture === 'function') {
		callback = architecture
		architecture = OS_ARCH_AGNOSTIC
	}

	if (typeof keys === 'string') {
		keys = [keys]
	}

	if (typeof callback === 'function') {
		execute(toCommandArgs('regList.wsf', architecture, keys), callback)
	} else {
		var outputStream = through2.obj(helper.vbsOutputTransform)

		cscript.init(function(err) {
			if (err) {
				return outputStream.emit('error', err)
			}

			var args = baseCommand('regListStream.wsf', architecture)

			var child = execFile(cscript.path(), args, { encoding: 'utf8' }, function(err) {
				if (err) {
					outputStream.emit('error', err)
				}
			})

			child.stderr.pipe(process.stderr)

			var slicer = new StreamSlicer({ sliceBy: helper.WIN_EOL })

			child.stdout.pipe(slicer).pipe(outputStream)

			helper.writeArrayToStream(keys, child.stdin)
		})

		return outputStream
	}
}

module.exports.createKey = function(keys, architecture, callback) {
	if (typeof architecture === 'function') {
		callback = architecture
		architecture = OS_ARCH_AGNOSTIC
	}

	if (typeof keys === 'string') {
		keys = [keys]
	}

	var args = baseCommand('regCreateKey.wsf', architecture)

	spawnEx(args, keys, callback)
}

module.exports.deleteKey = function(keys, architecture, callback) {
	if (typeof architecture === 'function') {
		callback = architecture
		architecture = OS_ARCH_AGNOSTIC
	}

	if (typeof keys === 'string') {
		keys = [keys]
	}

	var args = baseCommand('regDeleteKey.wsf', architecture)

	spawnEx(args, keys, callback)
}

module.exports.putValue = function(map, architecture, callback) {
	if (typeof architecture === 'function') {
		callback = architecture
		architecture = OS_ARCH_AGNOSTIC
	}

	var args = baseCommand('regPutValue.wsf', architecture)

	var values = []

	for (var key in map) {
		var keyValues = map[key]

		for (var valueName in keyValues) {
			var entry = keyValues[valueName]

			// helper writes the array to the stream in reversed order
			values.push(entry.type)
			values.push(renderValueByType(entry.value, entry.type))
			values.push(valueName)
			values.push(key)
		}
	}

	spawnEx(args, values, callback)
}

module.exports.arch = {}

module.exports.arch.list = function(keys, callback) {
	return module.exports.list(keys, OS_ARCH_SPECIFIC, callback)
}

module.exports.arch.list32 = function(keys, callback) {
	return module.exports.list(keys, OS_ARCH_32BIT, callback)
}

module.exports.arch.list64 = function(keys, callback) {
	return module.exports.list(keys, OS_ARCH_64BIT, callback)
}

module.exports.arch.createKey = function(keys, callback) {
	return module.exports.createKey(keys, OS_ARCH_SPECIFIC, callback)
}

module.exports.arch.createKey32 = function(keys, callback) {
	return module.exports.createKey(keys, OS_ARCH_32BIT, callback)
}

module.exports.arch.createKey64 = function(keys, callback) {
	return module.exports.createKey(keys, OS_ARCH_64BIT, callback)
}

module.exports.arch.deleteKey = function(keys, callback) {
	return module.exports.deleteKey(keys, OS_ARCH_SPECIFIC, callback)
}

module.exports.arch.deleteKey32 = function(keys, callback) {
	return module.exports.deleteKey(keys, OS_ARCH_32BIT, callback)
}

module.exports.arch.deleteKey64 = function(keys, callback) {
	return module.exports.deleteKey(keys, OS_ARCH_64BIT, callback)
}

module.exports.arch.putValue = function(keys, callback) {
	return module.exports.putValue(keys, OS_ARCH_SPECIFIC, callback)
}

module.exports.arch.putValue32 = function(keys, callback) {
	return module.exports.putValue(keys, OS_ARCH_32BIT, callback)
}

module.exports.arch.putValue64 = function(keys, callback) {
	return module.exports.putValue(keys, OS_ARCH_64BIT, callback)
}

function execute(args, callback) {

	if (typeof callback !== 'function') {
		throw new Error('missing callback')
	}

	debug(args)

	cscript.init(function(err) {
		if (err) {
			return callback(err)
		}

		childProcess.execFile(cscript.path(), args, function(err, stdout, stderr) {

			if (err) {
				if (stdout) {
					console.log(stdout)
				}

				if (stderr) {
					console.error(stderr)
				}

				if (err.code in errors) {
					return callback(errors[err.code])
				}
				return callback(err)

			}

			// in case we have stuff in stderr but no real error
			if (stderr) {
				return callback(new Error(stderr))
			}
			if (!stdout) {
				return callback()
			}

			debug(stdout)

			var result
			err = null

			try {
				result = JSON.parse(stdout)
			} catch (e) {
				e.stdout = stdout
				err = e
			}

			callback(err, result)
		})
	})
}

function spawnEx(args, keys, callback) {
	cscript.init(function(err) {
		if (err) {
			return callback(err)
		}

		debug(args)

		var child = execFile(cscript.path(), args, { encoding: 'utf8' })

		handleErrorsAndClose(child, callback)

		helper.writeArrayToStream(keys, child.stdin)
	})
}

function handleErrorsAndClose(child, callback) {
	var error
	child.once('error', function(e) {
		debug('process error %s', e)
		error = e
	})

	child.once('close', function(code) {
		debug('process exit with code %d', code)

		if (error) {
			if (error.code in errors) {
				return callback(errors[error.code])
			}
			return callback(error)

		}

		if (code !== 0) {
			if (code in errors) {
				return callback(errors[code])
			}
			return callback(new Error('vbscript process reported unknown error code ' + code))

		}

		callback()
	})
}

//TODO: move to helper.js?
function renderValueByType(value, type) {
	type = type.toUpperCase()

	switch (type) {
		case 'REG_BINARY':
			if (!util.isArray(value)) {
				throw new Error('invalid value type ' + typeof(value) + ' for registry type REG_BINARY, please use an array of numbers')
			}
			return value.join(',')

		case 'REG_MULTI_SZ':
			if (!util.isArray(value)) {
				throw new Error('invalid value type ' + typeof(value) + ' for registry type REG_BINARY, please use an array of strings')
			}
			return value.join(',')

		case 'REG_SZ':
			if (value === '') {
				return '\0'
			}
			return value

		default:
			return value
	}
}

//TODO: move to helper.js?
function toCommandArgs(cmd, arch, keys) {
	var result = baseCommand(cmd, arch)
	if (typeof keys === 'string') {
		result.push(keys)
	} else if (util.isArray(keys)) {
		result = result.concat(keys)
	} else {
		debug('creating command without using keys %s', keys ? keys : '')
	}

	return result
}

//TODO: move to helper.js?
function baseCommand(cmd, arch) {

	var scriptPath

	// test undefined, null and empty string
	if (externalVBSFolderLocation && typeof(externalVBSFolderLocation) === 'string') {
		scriptPath = externalVBSFolderLocation
	} else {
		scriptPath = path.join(__dirname, 'vbs')
	}

	return ['//Nologo', path.join(scriptPath, cmd), arch]
}
