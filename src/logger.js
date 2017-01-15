/* jshint esversion: 6 */
// example source from: https://github.com/screepers/screeps_console/blob/master/docs/ExampleLogger.js
var Logger = {};

Logger.colors = {
	'5': '#ff0066',
	'4': '#e65c00',
	'3': '#809fff',
	'2': '#cccccc',
	'1': '#999999',
	'0': '#666666',
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

	console.log('<font color="' + this.colors[severity] + '" severity="' + severity + '">' + message + "</font>");
};

Logger.highlight = function (message) {
	console.log('<font color="' + this.colors.highlight + '" type="highlight">' + message + "</font>");
};

module.exports = Logger;
