/*
 * prototype.link
 */

StructureLink.prototype.transferEnergyFirstTimeOnly = function(transferTarget) {
    var transferReturnVal = ERR_BUSY;
    
    if(!this.transferred) {
        transferReturnVal = this.transferEnergy(transferTarget);
        if(transferReturnVal === OK) {
           this.transferred = 1; 
        }
    } else {
        console.log('-link already transferred this tick - ' + this.id);
    }
    
    return transferReturnVal;
};


//StructureLink.prototype.testVar = 0;

StructureLink.prototype.testFunc = function() {

    //this.testVar++;
    
    if(this.testVariable) {
        //console.log('---testing - testVariable true - ' + this.id);
    } else {
        this.testVariable = 1
        console.log('---testing - testVariable false - ' + this.id);    
    }
    
};
