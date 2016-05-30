/*
 * prototype.creep
 */

module.exports = (function(){
	Creep.prototype.sayTest = function() {
        this.say('sayTest');
    }
})();
