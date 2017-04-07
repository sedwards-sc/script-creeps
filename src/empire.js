/* jshint esversion: 6 */

class Empire {

	constructor() {
		if(!Memory.empire) Memory.empire = {};
		_.defaults(Memory.empire, {
			allyRooms: [],
			hostileRooms: {},
			tradeIndex: 0,
			activeNukes: [],
			safe: {},
			danger: {},
			errantConstructionRooms: {},
		});
		this.memory = Memory.empire;

		this.storages = [];
	    this.terminals = [];
	    //swapTerminals: StructureTerminal[] = [];
	    this.spawnGroups = {};
	    //tradeResource: string;
	    //shortages: StructureTerminal[] = [];
	    //severeShortages: StructureTerminal[] = [];
	    //surpluses: StructureTerminal[] = [];
	    //allyTradeStatus: {[roomName: string]: boolean};
	}

	init() {
		// register my owned rooms
		for(let name in Game.rooms) {
			if(Game.rooms[name].isMine()) {
				empire.register(Game.rooms[name]);
			}
		}
	}

	register(room) {
		if(!room) return;

		let hasTerminal;
		if(room.terminal && room.terminal.my) {
		    hasTerminal = true;
		    this.terminals.push(room.terminal);
		}
		let hasStorage;
		if(room.storage && room.storage.my) {
		    hasStorage = true;
		    this.storages.push(room.storage);
		}

		//if(hasTerminal && hasStorage) {
		//    this.analyzeResources(room);
		//}
	}

	getSpawnGroup(roomName) {
        if(this.spawnGroups[roomName]) {
            return this.spawnGroups[roomName];
        } else {
            let room = Game.rooms[roomName];
			if(room) {
				let roomSpawns = room.findStructures(STRUCTURE_SPAWN);
				let ownedSpawns = false;
				for(let i in roomSpawns) {
					if(roomSpawns[i].my === true) {
						ownedSpawns = true;
						break;
					}
				}
				if(ownedSpawns === true) {
					this.spawnGroups[roomName] = new SpawnGroup(room);
					return this.spawnGroups[roomName];
				}
			}
        }
    }

	runActivities() {

	}
}

global.Empire = Empire;
