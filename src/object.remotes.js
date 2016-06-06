/*
 * object.remotes
 */

module.exports = (function(){

	RemoteMinerInfo = function(creepId, checkPointAway, sourceIndex) {
		this.creepId = creepId;
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

		var remoteMinerCheckPointE7S23 = new RoomPosition(48, 31, 'E7S23');

		var remoteMinerInfo0 = new RemoteMinerInfo('remoteMiner0', remoteMinerCheckPointE7S23, 0);
		this.E8S23.remoteMiners.push(remoteMinerInfo0);

		var remoteMinerInfo1 = new RemoteMinerInfo('remoteMiner1', remoteMinerCheckPointE7S23, 1);
		this.E8S23.remoteMiners.push(remoteMinerInfo1);

		
	}	
})();

