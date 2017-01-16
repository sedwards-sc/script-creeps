/* jshint esversion: 6 */
// example source from: https://github.com/screepers/screeps_console/blob/master/docs/ExampleLogger.js
var Logger = {};

Logger.colors = {
	'5': '#ff0066',	// critical
	'4': '#e65c00',	// warn
	'3': '#809fff',	// attention
	'2': '#cccccc',	// normal
	'1': '#666666',	// verbose
	'0': '#8fef8f',	// debug
	'highlight': '#ffff00',
};

Logger.log = function (message, severity = 2) {
	if(severity > 5) {
		severity = 5;
	} else if (severity < 0) {
		severity = 0;
	} else if (!Number.isInteger(severity)) {
		severity = 2;
	}

	if(typeof Memory.logLevel === 'undefined') {
		Memory.logLevel = 1;
	}

	if(severity >= Memory.logLevel) {
		console.log('<font color="' + this.colors[severity] + '" severity="' + severity + '">' + message + "</font>");
	}

	if(typeof Memory.notifyLevel === 'undefined') {
		Memory.notifyLevel = 5;
	}

	if(severity >= Memory.notifyLevel) {
		Game.notify('<font color="' + this.colors[severity] + '" severity="' + severity + '">' + message + "</font>");
	}
};

Logger.highlight = function (message) {
	console.log('<font color="' + this.colors.highlight + '" type="highlight">' + message + "</font>");
};

module.exports = Logger;
