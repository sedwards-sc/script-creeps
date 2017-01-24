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
}

global.Empire = Empire;
