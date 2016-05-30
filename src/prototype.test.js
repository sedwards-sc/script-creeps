Creep.prototype.consoleTest = function() {
	console.log('-console test');
	//this.say('consoleTest');
};

Creep.prototype.consoleTest2 = function(varTest) {
	console.log('--console test 2: ' + varTest);
};

module.exports = (function(){
	Creep.prototype.sayTest = function() {
        this.say('sayTest');
    }
})();
