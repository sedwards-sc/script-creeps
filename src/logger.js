/* jshint esversion: 6 */
// example source from: https://github.com/screepers/screeps_console/blob/master/docs/ExampleLogger.js
var logger = {};

logger.colors = {
	'5': '#ff0066',
	'4': '#e65c00',
	'3': '#809fff',
	'2': '#999999',
	'1': '#737373',
	'0': '#666666',
	'highlight': '#ffff00',
};

logger.log = function (message, severity = 3) {
	if(severity > 5) {
		severity = 5;
	} else if (severity < 0) {
		severity = 0;
	} else if (!Number.isInteger(severity)) {
		severity = 3;
	}

	console.log('<font color="' + this.colors[severity] + '" severity="' + severity + '">' + message + "</font>");
};

logger.highlight = function (message) {
	console.log('<font color="' + this.colors.highlight + '" type="highlight">' + message + "</font>");
};

module.exports = logger;
