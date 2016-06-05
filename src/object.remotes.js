/*
 * object.remotes
 */

module.exports = (function(){

	RemoteMinerInfo = function(checkPointAway, sourceIndex) {
		this.checkPointAway = checkPointAway;
		this.sourceIndex = sourceIndex || 0;
	}

	RemoteRoster = function() {
		this.remoteMiners = [];
		this.remoteCarriers = [];
		this.remoteBuilders = [];
		this.remoteUpgraders = [];
	}
	
	RoomRemotes = function() {
		this.E8S23 = new RemoteRoster();
		
		var remoteMinerCheckPoint0 = new RoomPosition(48, 31, 'E7S23');
		var remoteMinerInfo0 = new RemoteMinerInfo(remoteMinerCheckPoint0, 0);
		this.E8S23.remoteMiners.push(remoteMinerInfo0);
		
		var remoteMinerCheckPoint1 = new RoomPosition(48, 31, 'E7S23');
		var remoteMinerInfo1 = new RemoteMinerInfo(remoteMinerCheckPoint1,1);
		this.E8S23.remoteMiners.push(remoteMinerInfo1);
		
		
	}	
})();

