// Creep properties ====================================================================================================

// Boosting logic ------------------------------------------------------------------------------------------------------

Object.defineProperty(Creep.prototype, 'boosts', {
	get() {
		if (!this._boosts) {
			this._boosts = _.compact(_.unique(_.map(this.body as BodyPartDefinition[],
				bodyPart => bodyPart.boost))) as _ResourceConstantSansEnergy[];
		}
		return this._boosts;
		// return _.compact(_.unique(_.map(this.body as BodyPartDefinition[],
		// 								bodyPart => bodyPart.boost))) as _ResourceConstantSansEnergy[];
	},
	configurable: true,
});

Object.defineProperty(Creep.prototype, 'boostCounts', {
	get() {
		if (!this._boostCounts) {
			this._boostCounts = _.countBy(this.body as BodyPartDefinition[], bodyPart => bodyPart.boost);
		}
		return this._boostCounts;
	},
	configurable: true,
});

Object.defineProperty(Creep.prototype, 'bodyCounts', {
	get() {
		if (!this._bodyCounts) {
			this._bodyCounts = _.countBy(this.body as BodyPartDefinition[], bodyPart => bodyPart.type);
		}
		return this._bodyCounts;
	},
	configurable: true,
});

Object.defineProperty(Creep.prototype, 'inRampart', {
	get() {
		return !!this.pos.lookForStructure(STRUCTURE_RAMPART); // this assumes hostile creeps can't stand in my ramparts
	},
	configurable: true,
});