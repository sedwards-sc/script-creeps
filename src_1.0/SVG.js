/**
 * Parent to all SVG classes.
 * Contains methods available to all SVG classes.
 * @author Spedwards
 */
class SVG { }

/**
 * Takes a resource type constant as input and
 * returns the html/svg string for the icon of
 * that resource upon calling `.toString()`
 * @author Helam
 * @author Spedwards
 */
class SVGMineral extends SVG {

	/**
	 * @author Spedwards
	 * @param {string} resourceType
	 * @param {Number | Boolean} [amount = 0] - 0 by default, pass false to hide it
	 */
	constructor(resourceType, amount = 0) {
		super();
		if (typeof resourceType !== 'string') throw new Error('Resource is not a String!');
		if (!Number.isInteger(amount)) throw new Error('Amount is not an Integer!');

		this.resourceType = resourceType;
		this.amount = amount;
	}

	/**
	 * @author Helam
	 * @returns {string}
	 */
	toString() {
		let length = Math.max(1, Math.ceil(Math.log10(this.amount + 1)));
		let amountWidth = length * 10 + 5;

		if (this.amount === false) {
			amountWidth = 0;
		}

		let textDisplacement = 14;
		let finalWidth = 14 + amountWidth;

		let outStr = `<svg width="!!" height="14">`;

		if (this.resourceType === RESOURCE_ENERGY) {
			outStr += `<circle cx="7" cy="7" r="5" style="fill:#FEE476"/>`;
		} else if (this.resourceType === RESOURCE_POWER) {
			outStr += `<circle cx="7" cy="7" r="5" style="fill:#F1243A"/>`;
		} else {
			const BASE_MINERALS = {
				[undefined]: {back: `#fff`, front: `#000`},
				[RESOURCE_HYDROGEN]: {back: `#4B4B4B`, front: `#989898`},
				[RESOURCE_OXYGEN]: {back: `#4B4B4B`, front: `#989898`},
				[RESOURCE_UTRIUM]: {back: `#0A5D7C`, front: `#48C5E5`},
				[RESOURCE_LEMERGIUM]: {back: `#265C42`, front: `#24D490`},
				[RESOURCE_KEANIUM]: {back: `#371A80`, front: `#9269EC`},
				[RESOURCE_ZYNTHIUM]: {back: `#58482D`, front: `#D9B478`},
				[RESOURCE_CATALYST]: {back: `#572122`, front: `#F26D6F`},
			};

			const COMPOUNDS = {
				U: {back: `#58D7F7`, front: `#157694`},
				L: {back: `#29F4A5`, front: `#22815A`},
				K: {back: `#9F76FC`, front: `#482794`},
				Z: {back: `#FCD28D`, front: `#7F6944`},
				G: {back: `#FFFFFF`, front: `#767676`},
				O: {back: `#99ccff`, front: `#000066`},
				H: {back: `#99ccff`, front: `#000066`},
			};

			let colours = BASE_MINERALS[this.resourceType];

			if (colours) {
				outStr += `<circle cx="7" cy="7" r="5" style="stroke-width:1;stroke:${colours.front};fill:${colours.back}"/>` +
					`<text x="7" y="8" font-family="Verdana" font-size="8" alignment-baseline="middle" text-anchor="middle" style="fill:${colours.front};font-weight:bold;">${this.resourceType === undefined ? '?' : this.resourceType}</text>`;
			} else {
				let compoundType = ['U', 'L', 'K', 'Z', 'G', 'H', 'O'].find(type => resourceType.indexOf(type) !== -1);
				colours = COMPOUNDS[compoundType];
				if (colours) {
					let width = this.resourceType.length * 9;
					finalWidth += width;
					textDisplacement += width;
					outStr += `<rect x="0" y="0" width="${width}" height="14" style="fill:${colours.back}"/>` +
						`<text x="${width / 2.0}" y="8" font-family="Verdana" font-size="8" alignment-baseline="middle" text-anchor="middle" style="fill:${colours.front};font-weight:bold;">${this.resourceType}</text>`;
				} else {
					throw new Error(`Invalid resource type ${this.resourceType} in SVGMineral!`);
				}
			}
		}

		if (this.amount !== false) {
			outStr += `<text font-family="Verdana" font-size="10" x="${textDisplacement + amountWidth/2}" y="8" alignment-baseline="middle" text-anchor="middle" style="fill:white"> x ${this.amount.toLocaleString()}</text>`;
		}
		outStr += `</svg>`;

		outStr = outStr.split('!!').join(finalWidth);

		return outStr;
	}

}

/**
 * Acts as the parent to SVGStorage and SVGTerminal.
 * @author Helam
 * @author Enrico
 * @author Spedwards
 */
class SVGStorageObject extends SVG {

	/**
	 * @author Spedwards
	 * @param {StructureStorage | StructureContainer | StructureTerminal} object - Either a StructureStorage, StructureContainer or StructureTerminal object.
	 */
	constructor(object) {
		super();
		if (!(object instanceof StructureStorage || object instanceof StructureTerminal || object instanceof StructureContainer)) throw new Error('Not a Storage or Terminal object!');

		this.object = object;
	}

	/**
	 * Outputs the contents of any StructureStorage, StructureContainer or StructureTerminal
	 * object as a html/svg string.
	 * @author Helam
	 * @author Enrico
	 * @returns {string}
	 */
	toString() {
		let outStr = '';

		Object.keys(this.object.store).forEach(type => {
			outStr += (new SVGMineral(type, this.object.store[type])).toString();
			outStr += '\n';
		});
		return outStr;
	}

}

class SVGStorage extends SVGStorageObject {

	/**
	 * @author Spedwards
	 * @param {StructureStorage} storage
	 */
	constructor(storage) {
		if (!(storage instanceof StructureStorage)) throw new Error('Not a Storage object!');

		super(storage);
	}

}

class SVGTerminal extends SVGStorageObject {

	/**
	 * @author Spedwards
	 * @param {StructureTerminal} terminal
	 */
	constructor(terminal) {
		if (!(terminal instanceof StructureTerminal)) throw new Error('Not a Terminal object!');

		super(terminal);
	}

}

class SVGContainer extends SVGStorageObject {

	/**
	 * @author Spedwards
	 * @param {StructureContainer} container
	 */
	constructor(container) {
		if (!(container instanceof StructureContainer)) throw new Error('Not a Container object!');

		super(container);
	}

}

/**
 * Takes a room and outputs the html/svg string for the storage and terminal of that room.
 * @author Helam
 * @author Dragnar
 * @author Spedwards
 */
class SVGRoom extends SVG {

	/**
	 * @author Spedwards
	 * @param {Room | string} roomArg - Room object or valid room name.
	 */
	constructor(roomArg) {
		super();
		let room;
		if (roomArg instanceof Room) {
			room = roomArg;
		} else if (typeof roomArg === 'string') {
			room = Game.rooms[roomArg];
		} else if (roomArg.storage && roomArg.terminal) {
			room = roomArg;
		}
		if (!room) throw new Error(`Invalid argument or no access to room in SVGRoom()`);

		this.room = room;
	}

	/**
	 * @author Helam
	 * @author Dragnar
	 * @returns {string}
	 */
	toString() {
		let storage = this.room.storage;
		let terminal = this.room.terminal;

		let outStr = ``;

		outStr += `<style id="dropdownStyle">` +
			`.dropbtn {` +
				`background-color: #4CAF50;` +
				`color: white;` +
				`padding: 16px;` +
				`font-size: 16px;` +
				`border: none;` +
				`cursor: pointer;` +
			`}` +

			`.dropdown {` +
				`position: relative;` +
				`display: inline-block;` +
			`}` +

			`.dropdown-content {` +
				`display: none;` +
				`z-index: 1;` +
				`padding: 5px;` +
				`border-radius: 6px;` +
				`text-align: center;` +
				`position: absolute;` +
				`background-color: #f9f9f9;` +
				`min-width: 200px;` +
				`box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);` +
			`}` +

			`.dropdown-content a {` +
				`color: black;` +
				//`padding: 12px 16px;` +
				`text-decoration: none;` +
				`display: block;` +
			`}` +

			`.dropdown-content a:hover {background-color: #f1f1f1}` +

			`.dropdown:hover .dropdown-content {` +
				`display: block;` +
			`}` +

			`.dropdown:hover .dropbtn {` +
				`background-color: #3e8e41;` +
			`}` +
			`</style>` +


			`<style id="tooltipStyle">` +
			`.tool {` +
				`position: relative;` +
				`display: inline-block;` +
			`}` +
			`.tool .tip {` +
				`visibility: hidden;` +
				`width: 300px;` +
				`background-color: #111111` +//2c2c2c;`;
				`color: #000;` + //fff`;
				`text-align: center;` +
				`border-radius: 6px;` +
				`padding: 5px 0;` +
				`position: absolute;` +
				`z-index: 1;` +
				`opacity: 0;` +
				`transition: opacity 1s;` +
			`}` +
			`.tool .tipRight {` +
				`top: -5px;` +
				`left: 101%;` +
			`}` +
			`.tool:hover .tip {` +
				`visibility: visible;` +
				`opacity: 0.9;` +
			`}` +
			`.tool table {` +
				`text-align: left;` +
				`margin-left: 5px;` +
			`}` +
			`</style>` +

			`<span class="tool">` +
			`<span style="background-color:#000" class="tip">`;

		if (storage) {
			let svgStorage = new SVGStorage(storage);
			outStr += svgStorage.toString();
		} else {
			outStr += `No Storage Built`;
		}
		outStr += `</span>` +
			`<svg width="50" height="60">` +
			`<path style="stroke-width: 1;stroke:#90BA94" d='M16 48 C18 52 38 52 40 48 C42 46 42 18 40 16 C38 12 18 12 16 16 C14 18 14 46 16 48' />` +
			`<path style="fill:#555555" d='M18 46 L38 46 L38 18 L18 18' />` +
			`<!-- coords of storage inner box -->` +
			`<!--<rect x="18" y="18" width="20" height="28" style="fill:#F1243A" />-->`;
		if (storage) {
			let capacity = storage.storeCapacity;
			let energy = storage.store[RESOURCE_ENERGY];
			let power = storage.store[RESOURCE_POWER] || 0;
			let other = _.sum(storage.store) - energy - power;

			const HEIGHT = 28;
			const START_Y = 18;

			let energyHeight = HEIGHT * (energy / capacity);
			let otherHeight = HEIGHT * (other / capacity) + energyHeight;
			let powerHeight = HEIGHT * (power / capacity) + otherHeight;

			outStr += `<!-- power -->` +
				`<rect x="18" y="${START_Y + (HEIGHT - powerHeight)}" width="20" height="${powerHeight}" style="fill:#F1243A" />` +
				`<!-- minerals -->` +
				`<rect x="18" y="${START_Y + (HEIGHT - otherHeight)}" width="20" height="${otherHeight}" style="fill:#FFFFFF" />` +
				`<!-- energy -->` +
				`<rect x="18" y="${START_Y + (HEIGHT - energyHeight)}" width="20" height="${energyHeight}" style="fill:#FEE476" />`;
		} else {
			outStr += `<path style="fill:red" d='M44 18 L42 16 L28 30 L14 16 L12 18 L26 32 L12 46 L14 48 L28 34 L42 48 L44 46 L30 32 Z' />`;
		}

		outStr += `</svg>` +
			`</span>` +

			`<span class="tool">` +
			`<span style="background-color:#000" class="tip">`;

		if (terminal) {
			let svgTerminal = new SVGTerminal(terminal);
			outStr += svgTerminal.toString();
		} else {
			outStr += `No Terminal Built`;
		}

		outStr += `</span>` +
			`<svg width="50" height="60" style="transform:scale(1.2,1.2)">` +
			`<path vector-effect="non-scaling-stroke" style="stroke:#90BA94" d='M36 40 L42 32 L36 24 L28 18 L20 24 L14 32 L20 40 L28 46 Z' />` +
			`<path vector-effect="non-scaling-stroke" style="fill:#AAAAAA" d='M34 38 L38 32 L34 26 L28 22 L22 26 L18 32 L22 38 L28 42 Z' />` +
			`<path vector-effect="non-scaling-stroke" style="stroke-width:2;stroke:black;fill:#555555" d='M34 38 L34 32 L34 26 L28 26 L22 26 L22 32 L22 38 L28 38 Z' />`;

		if (terminal) {
			let capacity = terminal.storeCapacity;
			let energy = terminal.store[RESOURCE_ENERGY];
			let power = terminal.store[RESOURCE_POWER] || 0;
			let other = _.sum(terminal.store) - energy - power;

			const RADIUS = 6;

			const START_X = 22;
			const START_Y = 26;

			let energyRadius = RADIUS * (energy / capacity);
			let otherRadius = RADIUS * (other / capacity) + energyRadius;
			let powerRadius = RADIUS * (power / capacity) + otherRadius;

			let powerX = START_X + (RADIUS - powerRadius);
			let otherX = START_X + (RADIUS - otherRadius);
			let energyX = START_X + (RADIUS - energyRadius);

			let powerY = START_Y + (RADIUS - powerRadius);
			let otherY = START_Y + (RADIUS - otherRadius);
			let energyY = START_Y + (RADIUS - energyRadius);

			outStr += `<!-- power -->` +
				`<rect x="${powerX}" y="${powerY}" width="${powerRadius * 2}" height="${powerRadius * 2}" style="fill:#F1243A" />` +
				`<!-- minerals -->` +
				`<rect x="${otherX}" y="${otherY}" width="${otherRadius * 2}" height="${otherRadius * 2}" style="fill:#FFFFFF" />` +
				`<!-- energy -->` +
				`<rect x="${energyX}" y="${energyY}" width="${energyRadius * 2}" height="${energyRadius * 2}" style="fill:#FEE476" />`;
		} else {
			outStr += `<path style="fill:red" d='M44 18 L42 16 L28 30 L14 16 L12 18 L26 32 L12 46 L14 48 L28 34 L42 48 L44 46 L30 32 Z' />`;
		}
		outStr += `</svg>` +
			`</span>`;

		return outStr;
	}

}


/**
 * Returns a html/svg string representation of the given nuker object.
 * @author Enrico
 * @author Spedwards
 */
class SVGNuker extends SVG {

	/**
	 * @author Spedwards
	 * @param {StructureNuker} nuker
	 */
	constructor(nuker) {
		super();
		if (!(nuker instanceof StructureNuker)) throw new Error('Not a Nuker object!');

		this.nuker = nuker;
	}

	/**
	 * @author Enrico
	 * @returns {string}
	 */
	toString() {
		const SVG_HEIGHT = 60;
		const SVG_WIDTH = 40;

		let outStr = `<svg viewBox="0 0 120 180" height="${SVG_HEIGHT}" width="${SVG_WIDTH}">` +
			`<g transform="translate(60,130)">` +
			`<path d="M -60 50 L -53 0 L 0 -130 L 53 0 L 60 50 Z" fill="#181818" stroke-width="5"/>` +
			`<path d="M -40 0 L 0 -100 L 40 0 Z" fill="#555"/>` +
			`<rect fill="#555" height="15" width="80" x="-40" y="18"/>`;

		if (this.nuker.ghodium) {
			const GHODIUM_X = -40 * (this.nuker.ghodium / this.nuker.ghodiumCapacity);
			const GHODIUM_WIDTH = 80 * (this.nuker.ghodium / this.nuker.ghodiumCapacity);
			outStr += `<rect fill="#FFFFFF" height="15" y="18" width="${GHODIUM_WIDTH}" x="${GHODIUM_X}"/>`;
		}

		if (this.nuker.energy) {
			const ENERGY_SCALE = this.nuker.energy / this.nuker.energyCapacity;
			outStr += `<path d="M -40 0 L 0 -100 L 40 0 Z" fill="#FFE56D" transform="scale(${ENERGY_SCALE} ${ENERGY_SCALE})"/>`;
		}

		outStr += `</g></svg>`;
		return outStr;
	}

}

/**
 * Returns a html/svg string representation of the given lab object.
 * @author Enrico
 * @author Spedwards
 */
class SVGLab extends SVG {

	/**
	 * @author Spedwards
	 * @param {StructureLab} lab
	 * @param {Boolean} coloured
	 */
	constructor(lab, coloured = true) {
		super();
		if (!(lab instanceof StructureLab)) throw new Error('Not a Lab object!');

		this.lab = lab;
		this.coloured = coloured;
	}

	/**
	 * @author Enrico
	 * @returns {string}
	 */
	toString() {
		const SVG_HEIGHT = 50;
		const SVG_WIDTH = 50;

		let outStr = `<svg viewBox="0 0 120 120" height="${SVG_HEIGHT}" width="${SVG_WIDTH}">` +
			`<g transform="translate(60,55)">` +
			`<path class="border" d="M 50 40 A 60 60 0 1 0 -50 40 V 63 H 50 Z" fill="#181818" stroke-width="5"/>` +
			`<path d="M 36 33 A 46 43 0 1 0 -36 33 Z" fill="#555"/>`;

		if (this.lab.mineralType) {
			let MINERAL_COLOUR = '#FFFFFF';

			if (this.coloured && this.lab.mineralType.indexOf('G') === -1) {
				if (['H', 'O'].includes(this.lab.mineralType)) {
					MINERAL_COLOUR = '#989898';
				} else if (['UL', 'ZK', 'OH'].includes(this.lab.mineralType)) {
					MINERAL_COLOUR = '#B4B4B4';
				} else {
					const BASE_COLOURS = {
						[RESOURCE_UTRIUM]: '#48C5E5',
						[RESOURCE_LEMERGIUM]: '#24D490',
						[RESOURCE_KEANIUM]: '#9269EC',
						[RESOURCE_ZYNTHIUM]: '#D9B478',
					};
					let containedMineral = _(Object.keys(BASE_COLOURS)).find(c => this.lab.mineralType.indexOf(c) !== -1);
					if (containedMineral) {
						MINERAL_COLOUR = BASE_COLOURS[containedMineral];
					}
				}
			}

			const MINERAL_TRANSFORM = this.lab.mineralAmount / this.lab.mineralCapacity;
			outStr += `<path d="M 36 33 A 46 43 0 1 0 -36 33 Z" fill="${MINERAL_COLOUR}" transform="matrix(${MINERAL_TRANSFORM},0,0,${MINERAL_TRANSFORM},0,${33*(1-MINERAL_TRANSFORM)})"/>`;
		}

		if (this.lab.energy) {
			const ENERGY_WIDTH = 72 * (this.lab.energy / this.lab.energyCapacity);
			const ENERGY_X = -36 * (this.lab.energy / this.lab.energyCapacity);
			outStr += `<rect fill="#ffe56d" height="10" y="43" width="${ENERGY_WIDTH}" x="${ENERGY_X}"/>`;
		}

		outStr += `</g></svg>`;
		return outStr;
	}

}

global.svg = {
	mineral: SVGMineral,
	storage: SVGStorage,
	terminal: SVGTerminal,
	nuker: SVGNuker,
	lab: SVGLab,
	room: SVGRoom,
};
