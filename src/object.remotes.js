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
		// Room: E8S23
		this.E8S23 = new RemoteRoster();

		// remote miners for E7S23
		var remoteMinerCheckPointE7S23 = new RoomPosition(48, 31, 'E7S23');

		var remoteMinerInfo0 = new RemoteMinerInfo('remoteMiner0', remoteMinerCheckPointE7S23, 0);
		this.E8S23.remoteMiners.push(remoteMinerInfo0);

		var remoteMinerInfo1 = new RemoteMinerInfo('remoteMiner1', remoteMinerCheckPointE7S23, 1);
		this.E8S23.remoteMiners.push(remoteMinerInfo1);
		
		// remote miner for E9S23
		var remoteMinerCheckPointE9S23 = new RoomPosition(6, 10, 'E9S23');

		var remoteMinerInfo2 = new RemoteMinerInfo('remoteMiner2', remoteMinerCheckPointE9S23, 0);
		this.E8S23.remoteMiners.push(remoteMinerInfo2);

		
		// remote carriers for E7S23
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
		
		// remote carrier for E9S23
		var remoteCarrierCheckPointE8S23HomeRight = new RoomPosition(47, 10, 'E8S23');
		var remoteCarrierCheckPointE9S23Away0 = new RoomPosition(8, 10, 'E9S23');
		
		var remoteCarrierInfo4 = new RemoteCarrierInfo('remoteCarrier4', remoteCarrierCheckPointE9S23Away0, remoteCarrierCheckPointE8S23HomeRight);
		this.E8S23.remoteCarriers.push(remoteCarrierInfo4);
		
		var remoteCarrierInfo5 = new RemoteCarrierInfo('remoteCarrier5', remoteCarrierCheckPointE9S23Away0, remoteCarrierCheckPointE8S23HomeRight);
		this.E8S23.remoteCarriers.push(remoteCarrierInfo5);
		
		var remoteCarrierInfo6 = new RemoteCarrierInfo('remoteCarrier6', remoteCarrierCheckPointE9S23Away0, remoteCarrierCheckPointE8S23HomeRight);
		this.E8S23.remoteCarriers.push(remoteCarrierInfo6);
		
		
		// reservers
		var reserverInfo0 = new ReserverInfo('reserver0', '55db333cefa8e3fe66e056d8');
		this.E8S23.reservers.push(reserverInfo0);
		
		var reserverInfo1 = new ReserverInfo('reserver1', '55db3354efa8e3fe66e05757');
		this.E8S23.reservers.push(reserverInfo1);
		
		
		
		// Room: E9S27
		this.E9S27 = new RemoteRoster();

		// remote miner for E8S27
		var remoteMinerCheckPointE8S27 = new RoomPosition(23, 25, 'E8S27');

		var remoteMinerInfo3 = new RemoteMinerInfo('remoteMiner3', remoteMinerCheckPointE8S27, 0);
		this.E9S27.remoteMiners.push(remoteMinerInfo3);
		
	}	
})();

