// All structure prototypes

// General structure prototypes ========================================================================================

import { USER_NAME } from "config";

Object.defineProperty(Structure.prototype, 'isWalkable', {
	get() {
		return this.structureType == STRUCTURE_ROAD ||
			   this.structureType == STRUCTURE_CONTAINER ||
			   (this.structureType == STRUCTURE_RAMPART && ((this.my as StructureRampart) ||
															(this.isPublic as StructureRampart)));
	},
	configurable: true,
});

// Container prototypes ================================================================================================

Object.defineProperty(StructureContainer.prototype, 'energy', {
	get() {
		return this.store.energy;
	},
	configurable: true,
});

Object.defineProperty(StructureContainer.prototype, 'isFull', { // if this container-like object is full
	get() {
		return !this.store.getFreeCapacity();
	},
	configurable: true,
});
Object.defineProperty(StructureContainer.prototype, 'isEmpty', { // if this container-like object is empty
	get() {
		return !this.store.getUsedCapacity();
	},
	configurable: true,
});

// Controller prototypes ===============================================================================================

Object.defineProperty(StructureController.prototype, 'reservedByMe', {
	get() {
		return this.reservation && this.reservation.username == USER_NAME;
	},
	configurable: true,
});

// Object.defineProperty(StructureController.prototype, 'signedByMe', {
// 	get() {
// 		return this.sign && this.sign.text == Memory.settings.signature && Game.time - this.sign.time < 250000;
// 	},
// 	configurable: true,
// });

Object.defineProperty(StructureController.prototype, 'signedByScreeps', {
	get() {
		return this.sign && this.sign.username == 'Screeps';
	},
	configurable: true,
});

StructureController.prototype.needsReserving = function(reserveBuffer: number): boolean {
	return !this.reservation || (this.reservedByMe && this.reservation.ticksToEnd < reserveBuffer);
};

// Extension prototypes ================================================================================================

Object.defineProperty(StructureExtension.prototype, 'isFull', { // if this container-like object is full
	get() {
		return this.store.getFreeCapacity(RESOURCE_ENERGY) == 0;
	},
	configurable: true,
});

Object.defineProperty(StructureExtension.prototype, 'isEmpty', { // if this container-like object is empty
	get() {
		return this.store.getUsedCapacity(RESOURCE_ENERGY) == 0;
	},
	configurable: true,
});

// Link prototypes =====================================================================================================

Object.defineProperty(StructureLink.prototype, 'isFull', { // if this container-like object is full
	get() {
		return this.store.getFreeCapacity(RESOURCE_ENERGY) == 0;
	},
	configurable: true,
});

Object.defineProperty(StructureLink.prototype, 'isEmpty', { // if this container-like object is empty
	get() {
		return this.store.getUsedCapacity(RESOURCE_ENERGY) == 0;
	},
	configurable: true,
});


// Nuker prototypes ====================================================================================================

// PowerSpawn prototypes ===============================================================================================

// Spawn prototypes ====================================================================================================

Object.defineProperty(StructureSpawn.prototype, 'isFull', { // if this container-like object is full
	get() {
		return this.store.getFreeCapacity(RESOURCE_ENERGY) == 0;
	},
	configurable: true,
});

Object.defineProperty(StructureSpawn.prototype, 'isEmpty', { // if this container-like object is empty
	get() {
		return this.store.getUsedCapacity(RESOURCE_ENERGY) == 0;
	},
	configurable: true,
});


// Storage prototypes ==================================================================================================

Object.defineProperty(StructureStorage.prototype, 'energy', {
	get() {
		return this.store.energy;
	},
	configurable: true,
});

Object.defineProperty(StructureStorage.prototype, 'isFull', { // if this container-like object is full
	get() {
		return !this.store.getFreeCapacity();
	},
	configurable: true,
});

Object.defineProperty(StructureStorage.prototype, 'isEmpty', { // if this container-like object is empty
	get() {
		return !this.store.getUsedCapacity();
	},
	configurable: true,
});

// Terminal prototypes =================================================================================================

Object.defineProperty(StructureTerminal.prototype, 'energy', {
	get() {
		return this.store.energy;
	},
	configurable: true,
});

Object.defineProperty(StructureTerminal.prototype, 'isFull', { // if this container-like object is full
	get() {
		return !this.store.getFreeCapacity();
	},
	configurable: true,
});

Object.defineProperty(StructureTerminal.prototype, 'isEmpty', { // if this container-like object is empty
	get() {
		return !this.store.getUsedCapacity();
	},
	configurable: true,
});

// Tower prototypes

Object.defineProperty(StructureTower.prototype, 'isFull', { // if this container-like object is full
	get() {
		return this.store.getFreeCapacity(RESOURCE_ENERGY) == 0;
	},
	configurable: true,
});

Object.defineProperty(StructureTower.prototype, 'isEmpty', { // if this container-like object is empty
	get() {
		return this.store.getUsedCapacity(RESOURCE_ENERGY) == 0;
	},
	configurable: true,
});

// Tombstone prototypes ================================================================================================
Object.defineProperty(Tombstone.prototype, 'energy', {
	get() {
		return this.store.energy;
	},
	configurable: true,
});

// Ruin prototypes ================================================================================================
Object.defineProperty(Ruin.prototype, 'energy', {
	get() {
		return this.store.energy;
	},
	configurable: true,
});

Object.defineProperty(Ruin.prototype, 'power', {
	get() {
		return this.store.power || 0;
	},
	configurable: true,
});