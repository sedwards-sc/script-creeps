/* jshint esversion: 6 */
/*
 * prototype.roomposition
 */

 RoomPosition.prototype.toString = function(htmlLink = true, id = undefined, memWatch = undefined) {
	if(htmlLink){
		var onClick = '';
		if(id) {
			onClick += `angular.element('body').injector().get('RoomViewPendingSelector').set('${id}');`;
		}
		if(memWatch) {
			onClick += `angular.element($('section.memory')).scope().Memory.addWatch('${memWatch}'); angular.element($('section.memory')).scope().Memory.selectedObjectWatch='${memWatch}';`;
		}
		return `<a href="#!/room/${this.roomName}" onClick="${onClick}">[${ this.roomName } ${ this.x },${ this.y }]</a>`;
	}
	return `[${this.roomName} ${this.x},${this.y}]`;
 };
