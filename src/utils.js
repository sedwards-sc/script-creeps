/* jshint esversion: 6 */

module.exports = (function(){
	undefToZero = function(x) {
		return x || 0;
	};

	isNullOrUndefined = function(theObject) {
	    return (theObject === undefined || theObject === null);
	};
});
