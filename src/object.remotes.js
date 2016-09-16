/* jshint esversion: 6 */
/*
 * object.remotes
 */

module.exports = (function(){

	RemoteMinerInfo = function(creepId, checkPointAway, sourceIndex) {
		this.creepId = creepId;
		this.checkPointAway = checkPointAway;
		this.sourceIndex = sourceIndex || 0;
	};

	RemoteCarrierInfo = function(creepId, checkPointAway, checkPointHome) {
		this.creepId = creepId;
		this.checkPointAway = checkPointAway;
		this.checkPointHome = checkPointHome;
	};

	ReserverInfo = function(creepId, controllerId) {
		this.creepId = creepId;
		this.controllerId = controllerId;
	};

	RemoteRoster = function() {
		this.remoteMiners = [];
		this.remoteCarriers = [];
		this.remoteBuilders = [];
		this.remoteUpgraders = [];
		this.reservers = [];
	};

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

		// remote miner for E9S22
		let remoteMinerCheckPointE9S22 = new RoomPosition(23, 47, 'E9S22');

		var remoteMinerInfo5 = new RemoteMinerInfo('remoteMiner5', remoteMinerCheckPointE9S22, 0);
		this.E8S23.remoteMiners.push(remoteMinerInfo5);


		// remote carriers for E7S23
		var remoteCarrierCheckPointE8S23HomeLeft = new RoomPosition(3, 26, 'E8S23');

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

		// remote carriers for E9S23
		var remoteCarrierCheckPointE8S23HomeRight = new RoomPosition(47, 10, 'E8S23');
		var remoteCarrierCheckPointE9S23Away0 = new RoomPosition(8, 10, 'E9S23');

		var remoteCarrierInfo4 = new RemoteCarrierInfo('remoteCarrier4', remoteCarrierCheckPointE9S23Away0, remoteCarrierCheckPointE8S23HomeRight);
		this.E8S23.remoteCarriers.push(remoteCarrierInfo4);

		var remoteCarrierInfo5 = new RemoteCarrierInfo('remoteCarrier5', remoteCarrierCheckPointE9S23Away0, remoteCarrierCheckPointE8S23HomeRight);
		this.E8S23.remoteCarriers.push(remoteCarrierInfo5);

		var remoteCarrierInfo6 = new RemoteCarrierInfo('remoteCarrier6', remoteCarrierCheckPointE9S23Away0, remoteCarrierCheckPointE8S23HomeRight);
		this.E8S23.remoteCarriers.push(remoteCarrierInfo6);

		// remote carriers for E9S22
		let remoteCarrierCheckPointE9S22Away0 = new RoomPosition(21, 47, 'E9S22');

		let remoteCarrierInfo12 = new RemoteCarrierInfo('remoteCarrier12', remoteCarrierCheckPointE9S22Away0, remoteCarrierCheckPointE8S23HomeRight);
		this.E8S23.remoteCarriers.push(remoteCarrierInfo12);

		let remoteCarrierInfo13 = new RemoteCarrierInfo('remoteCarrier13', remoteCarrierCheckPointE9S22Away0, remoteCarrierCheckPointE8S23HomeRight);
		this.E8S23.remoteCarriers.push(remoteCarrierInfo13);


		// reservers
		var reserverInfo0 = new ReserverInfo('reserver0', '55db333cefa8e3fe66e056d8');
		this.E8S23.reservers.push(reserverInfo0);

		var reserverInfo1 = new ReserverInfo('reserver1', '55db3354efa8e3fe66e05757');
		this.E8S23.reservers.push(reserverInfo1);

		let reserverInfo4 = new ReserverInfo('reserver4', '55db3353efa8e3fe66e05754');
		this.E8S23.reservers.push(reserverInfo4);



		// Room: E9S27
		this.E9S27 = new RemoteRoster();

		// remote miner for E8S27
		var remoteMinerCheckPointE8S27 = new RoomPosition(23, 25, 'E8S27');

		var remoteMinerInfo3 = new RemoteMinerInfo('remoteMiner3', remoteMinerCheckPointE8S27, 0);
		this.E9S27.remoteMiners.push(remoteMinerInfo3);

		// remote miner for E8S26
		let remoteMinerCheckPointE8S26 = new RoomPosition(38, 46, 'E8S26');

		let remoteMinerInfo6 = new RemoteMinerInfo('remoteMiner6', remoteMinerCheckPointE8S26, 0);
		this.E9S27.remoteMiners.push(remoteMinerInfo6);


		// remote carriers for E8S27
		var remoteCarrierCheckPointE9S27HomeLeft = new RoomPosition(2, 8, 'E9S27');
		var remoteCarrierCheckPointE8S27Away0 = new RoomPosition(25, 25, 'E8S27');

		var remoteCarrierInfo7 = new RemoteCarrierInfo('remoteCarrier7', remoteCarrierCheckPointE8S27Away0, remoteCarrierCheckPointE9S27HomeLeft);
		this.E9S27.remoteCarriers.push(remoteCarrierInfo7);

		var remoteCarrierInfo8 = new RemoteCarrierInfo('remoteCarrier8', remoteCarrierCheckPointE8S27Away0, remoteCarrierCheckPointE9S27HomeLeft);
		this.E9S27.remoteCarriers.push(remoteCarrierInfo8);

		var remoteCarrierInfo9 = new RemoteCarrierInfo('remoteCarrier9', remoteCarrierCheckPointE8S27Away0, remoteCarrierCheckPointE9S27HomeLeft);
		this.E9S27.remoteCarriers.push(remoteCarrierInfo9);

		// remote carriers for E8S26
		let remoteCarrierCheckPointE8S26Away0 = new RoomPosition(38, 43, 'E8S26');

		let remoteCarrierInfo14 = new RemoteCarrierInfo('remoteCarrier14', remoteCarrierCheckPointE8S26Away0, remoteCarrierCheckPointE9S27HomeLeft);
		this.E9S27.remoteCarriers.push(remoteCarrierInfo14);

		let remoteCarrierInfo15 = new RemoteCarrierInfo('remoteCarrier15', remoteCarrierCheckPointE8S26Away0, remoteCarrierCheckPointE9S27HomeLeft);
		this.E9S27.remoteCarriers.push(remoteCarrierInfo15);


		// reservers
		var reserverInfo2 = new ReserverInfo('reserver2', '55db334aefa8e3fe66e05727');
		this.E9S27.reservers.push(reserverInfo2);

		let reserverInfo5 = new ReserverInfo('reserver5', '55db3349efa8e3fe66e05723');
		this.E9S27.reservers.push(reserverInfo5);



		// Room: E9S28
		this.E9S28 = new RemoteRoster();

		// remote miner for E8S28
		let remoteMinerCheckPointE8S28 = new RoomPosition(40, 40, 'E8S28');

		let remoteMinerInfo4 = new RemoteMinerInfo('remoteMiner4', remoteMinerCheckPointE8S28, 0);
		this.E9S28.remoteMiners.push(remoteMinerInfo4);


		// remote carriers for E8S28
		let remoteCarrierCheckPointE9S28HomeLeft = new RoomPosition(5, 35, 'E9S28');
		let remoteCarrierCheckPointE8S28Away0 = new RoomPosition(42, 42, 'E8S28');

		let remoteCarrierInfo10 = new RemoteCarrierInfo('remoteCarrier10', remoteCarrierCheckPointE8S28Away0, remoteCarrierCheckPointE9S28HomeLeft);
		this.E9S28.remoteCarriers.push(remoteCarrierInfo10);

		let remoteCarrierInfo11 = new RemoteCarrierInfo('remoteCarrier11', remoteCarrierCheckPointE8S28Away0, remoteCarrierCheckPointE9S28HomeLeft);
		this.E9S28.remoteCarriers.push(remoteCarrierInfo11);

		//var remoteCarrierInfo9 = new RemoteCarrierInfo('remoteCarrier9', remoteCarrierCheckPointE8S27Away0, remoteCarrierCheckPointE9S27HomeLeft);
		//this.E9S27.remoteCarriers.push(remoteCarrierInfo9);


		// reservers
		let reserverInfo3 = new ReserverInfo('reserver3', '55db334aefa8e3fe66e05729');
		this.E9S28.reservers.push(reserverInfo3);



		// Room: E7S25
		this.E7S25 = new RemoteRoster();

		// remote miner for E7S26
		let remoteMinerCheckPointE7S26 = new RoomPosition(37, 6, 'E7S26');

		let remoteMinerInfo7 = new RemoteMinerInfo('remoteMiner7', remoteMinerCheckPointE7S26, 0);
		this.E7S25.remoteMiners.push(remoteMinerInfo7);


		// remote carriers for E7S26
		let remoteCarrierCheckPointE7S25HomeBottom = new RoomPosition(32, 44, 'E7S25');
		let remoteCarrierCheckPointE7S26Away0 = new RoomPosition(38, 4, 'E7S26');

		let remoteCarrierInfo16 = new RemoteCarrierInfo('remoteCarrier16', remoteCarrierCheckPointE7S26Away0, remoteCarrierCheckPointE7S25HomeBottom);
		this.E7S25.remoteCarriers.push(remoteCarrierInfo16);

		let remoteCarrierInfo17 = new RemoteCarrierInfo('remoteCarrier17', remoteCarrierCheckPointE7S26Away0, remoteCarrierCheckPointE7S25HomeBottom);
		this.E7S25.remoteCarriers.push(remoteCarrierInfo17);


		// reservers
		let reserverInfo6 = new ReserverInfo('reserver6', '55db333eefa8e3fe66e056e3');
		this.E7S25.reservers.push(reserverInfo6);



		// Room: E9S24
		this.E9S24 = new RemoteRoster();

		// reservers
		let reserverInfo7 = new ReserverInfo('reserver7', '55db3355efa8e3fe66e0575f');
		this.E9S24.reservers.push(reserverInfo7);



		// Room: E6S32
		this.E6S32 = new RemoteRoster();

		// reservers
		let reserverInfo8 = new ReserverInfo('reserver8', '576a9c3c57110ab231d88b98');
		this.E6S32.reservers.push(reserverInfo8);

		// reservers
		let reserverInfo9 = new ReserverInfo('reserver9', '576a9c4057110ab231d88bf3');
		this.E6S32.reservers.push(reserverInfo9);



		// Room: E8S32
		this.E8S32 = new RemoteRoster();

		// reservers
		let reserverInfo10 = new ReserverInfo('reserver10', '576a9c4257110ab231d88c48');
		this.E8S32.reservers.push(reserverInfo10);

		let reserverInfo11 = new ReserverInfo('reserver11', '576a9c4557110ab231d88c87');
		this.E8S32.reservers.push(reserverInfo11);



		// Room: E7S34
		//this.E7S34 = new RemoteRoster();

		// reservers
		let reserverInfo12 = new ReserverInfo('reserver12', '576a9c4557110ab231d88c92');
		//this.E7S34.reservers.push(reserverInfo12);
		this.E8S32.reservers.push(reserverInfo12);

	};
})();
