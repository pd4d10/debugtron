/* eslint-disable global-require */

var ifAsync
var fs
var execFile
var debug
var init

/*
 *  when we mock stuff we need a way to reset
 */
function resetDependencies() {
	init = false
	ifAsync = require('if-async')
	fs = require('fs')
	execFile = require('../lib/execFile.js')({ bufferStdout: true, bufferStderr: true })
	debug = require('debug')('regedit:cscript')
}

resetDependencies()

/*
 *  expected output for failed where.exe execution, exported for testing purposes
 */
var CSCRIPT_NOT_FOUND = module.exports.CSCRIPT_NOT_FOUND = 'INFO: Could not find files for the given pattern(s).'

/*
 *  expected output for cscript.exe, exported for testing purposes
 */
var CSCRIPT_EXPECTED_OUTPUT = module.exports.CSCRIPT_EXPECTED_OUTPUT = 'Microsoft (R) Windows Script Host Version'

var cscript = 'cscript.exe'

module.exports.path = function() {
	// this sucks...
	if (init === false) {
		throw new Error('must initialize first')
	}
	debug(cscript)
	return cscript
}

module.exports.init = function(callback) {
	debug('init()')

	if (init) {
		debug('already initialized')
		return setImmediate(callback)
	}

	var functor =
		ifAsync(spawnCScriptSucceeded)
		.or(whereCScriptSucceeded)
		.or(fsStatCScriptSucceeded)
		.then(function(cb) {
			init = true
			cb()
		})
		.else(callbackWithError)

	functor(function(err) {
		if (err) {
			return callback(err)
		}
		callback()
	})
}

module.exports._mock = function(_fs, _execFile, _init) {
	fs = _fs
	execFile = _execFile
	init = _init
}

module.exports._mockReset = resetDependencies

function spawnCScriptSucceeded(callback) {
	debug('spawnCScriptSucceeded()')

	execFile('cscript.exe', function(err, stdout, stderr) {

		if (err) {
			// where command not found on this system
			if (err.code === 'ENOENT') {
				return callback(null, false)
			}
			return callback(err)

		}

		cscript = 'cscript.exe'
		callback(null, stdout.indexOf(CSCRIPT_EXPECTED_OUTPUT) > -1)
	})
}

function whereCScriptSucceeded(callback) {
	debug('whereCScriptSucceeded()')

	execFile('where cscript.exe', function(err, stdout, stderr) {

		if (err) {
			// where command not found on this system
			if (err.code === 'ENOENT') {
				return callback(null, false)
			}
			return callback(err)

		}

		if (typeof stdout !== 'string') {
			return callback(null, false)
		}
		if (stdout.indexOf(CSCRIPT_NOT_FOUND) > -1) {
			return callback(null, false)
		}

		cscript = stdout.trim()
		callback(null, true)
	})
}

function fsStatCScriptSucceeded(callback) {
	debug('fsStatCScriptSucceeded()')

	fs.stat('c:\\windows\\system32\\cscript.exe', function(err, stat) {
		if (err) {
			if (err.code === 'ENOENT') {
				return callback(null, false)
			}
			return callback(err)

		}

		cscript = 'c:\\windows\\system32\\cscript.exe'
		callback(null, true)
	})
}

function callbackWithError(cb) {
	cb(new Error('cscript not found'))
}

function once(cb) {
	var fired = false
	return function() {
		if (fired) {
			return cb()
		}
		fired = true

		cb.apply(null, arguments)
	}
}
