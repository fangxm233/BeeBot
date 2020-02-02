Object.defineProperty(ConstructionSite.prototype, 'isWalkable', {
	get() {
        return !this.my || 
               this.structureType == STRUCTURE_ROAD ||
			   this.structureType == STRUCTURE_CONTAINER ||
			   this.structureType == STRUCTURE_RAMPART;
	},
	configurable: true,
});