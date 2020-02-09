import { CreepSetup } from "./CreepSetup";

export const ROLE_FILLER = 'filler';
export const ROLE_MINER = 'miner';
export const ROLE_CARRIER = 'carrier';
export const ROLE_MANAGER = 'manager';

export const setups = {
    [ROLE_FILLER]: {
        early: new CreepSetup(ROLE_FILLER, {
            ratio: {
                [CARRY]: 1,
                [MOVE]: 1
            }, 
            maxSize: Infinity
        }),

        default: new CreepSetup(ROLE_FILLER, {
            ratio: {
                [CARRY]: 2,
                [MOVE]: 1
            },
            padding: {
                [CARRY]: 1,
                [MOVE]: 1
            },
            maxSize: Infinity
        })
    },

    [ROLE_MINER]: {
        source: {
            default: new CreepSetup(ROLE_MINER, {
                ratio: {
                    [WORK]: 6,
                    [CARRY]: 1,
                    [MOVE]: 3
                },
                maxSize: 1
            }),

            outpost: new CreepSetup(ROLE_MINER, {
                ratio: {
                    [WORK]: 6,
                    [MOVE]: 3,
                    [CARRY]: 1
                },
                maxSize: 2
            }),

            fast: new CreepSetup(ROLE_MINER, {
                ratio: {
                    [WORK]: 20,
                    [CARRY]: 4,
                    [MOVE]: 10
                },
                maxSize: 1
            }),
        },

        mineral: {
            default: new CreepSetup(ROLE_MINER, {
                ratio: {
                    [WORK]: 4,
                    [MOVE]: 1
                },
                maxSize: Infinity
            })
        }
    },

    [ROLE_CARRIER]: {
        default: new CreepSetup(ROLE_CARRIER, {
            ratio: {
                [CARRY]: 2,
                [MOVE]: 1
            },
            padding: {
                [CARRY]: 1,
                [MOVE]: 1
            },
            maxSize: Infinity
        }),

        outpost: new CreepSetup(ROLE_CARRIER, {
            ratio: {
                [CARRY]: 2,
                [MOVE]: 1
            },
            padding: {
                [CARRY]: 1,
                [MOVE]: 1
            },
            prefix: [WORK, WORK],
            suffix: [MOVE],
            maxSize: Infinity
        }),
    },

    [ROLE_MANAGER]: {
        default: new CreepSetup(ROLE_MANAGER, {
            ratio: {
                [CARRY]: 2,
                [MOVE]: 1
            },
            maxSize: 15
        })
    }
}