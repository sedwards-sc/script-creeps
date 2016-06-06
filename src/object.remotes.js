/*
 * object.remotes
 */

module.exports = (function(){

	RemoteMinerInfo = function(creepId, checkPointAway, sourceIndex) {
		this.creepId = creepId;
		this.checkPointAway = checkPointAway;
		this.sourceIndex = sourceIndex || 0;
	}
	
	RemoteCarrierInfo = function(creepId, checkPointAway, checkPointHome) {
		this.creepId = creepId;
		this.checkPointAway = checkPointAway;
		this.checkPointHome = checkPointHome;
	}
	
	ReserverInfo = function(creepId, controllerId) {
		this.creepId = creepId;
		this.controllerId = controllerId;
	}

	RemoteRoster = function() {
		this.remoteMiners = [];
		this.remoteCarriers = [];
		this.remoteBuilders = [];
		this.remoteUpgraders = [];
		this.reservers = [];
	}
	
	RoomRemotes = function() {
		this.E8S23 = new RemoteRoster();

		// remote miners
		var remoteMinerCheckPointE7S23 = new RoomPosition(48, 31, 'E7S23');

		var remoteMinerInfo0 = new RemoteMinerInfo('remoteMiner0', remoteMinerCheckPointE7S23, 0);
		this.E8S23.remoteMiners.push(remoteMinerInfo0);

		var remoteMinerInfo1 = new RemoteMinerInfo('remoteMiner1', remoteMinerCheckPointE7S23, 1);
		this.E8S23.remoteMiners.push(remoteMinerInfo1);

		// remote carriers
		var remoteCarrierCheckPointE8S23HomeLeft = new RoomPosition(2, 25, 'E8S23');
		
		var remoteCarrierCheckPointE7S23Away0 = new RoomPosition(48, 34, 'E7S23');
		var remoteCarrierInfo0 = new RemoteCarrierInfo('remoteCarrier0', remoteCarrierCheckPointE7S23Away0, remoteCarrierCheckPointE8S23HomeLeft);
		this.E8S23.remoteCarriers.push(remoteCarrierInfo0);
		
		var remoteCarrierInfo1 = new RemoteCarrierInfo('remoteCarrier1', remoteCarrierCheckPointE7S23Away0, remoteCarrierCheckPointE8S23HomeLeft);
		this.E8S23.remoteCarriers.push(remoteCarrierInfo1);
		
		var remoteCarrierCheckPointE7S23Away1 = new RoomPosition(45, 28, 'E7S23');
		var remoteCarrierInfo2 = new RemoteCarrierInfo('remoteCarrier2', remoteCarrierCheckPointE7S23Away1, remoteCarrierCheckPointE8S23HomeLeft);
		this.E8S23.remoteCarriers.push(remoteCarrierInfo2);
		
		var remoteCarrierInfo3 = new RemoteCarrierInfo('remoteCarrier3', remoteCarrierCheckPointE7S23Away1, remoteCarrierCheckPointE8S23HomeLeft);
		this.E8S23.remoteCarriers.push(remoteCarrierInfo3);
		
		// reservers
		var reserverInfo0 = new ReserverInfo('reserver0', '55db333cefa8e3fe66e056d8');
		this.E8S23.reservers.push(reserverInfo0);
	}	
})();

