import {
    ROLE_CARRIER, ROLE_CLAIMER, ROLE_DE_INVADER, ROLE_DE_INVADER_CORE, ROLE_DISMANTLER, ROLE_DRONE,
    ROLE_FILLER,
    ROLE_MANAGER,
    ROLE_MINER,
    ROLE_PIONEER,
    ROLE_RESERVER,
    ROLE_SCOUT,
    ROLE_UPGRADER,
    ROLE_WORKER,
} from 'declarations/constantsExport';
import { BeeSetup } from "./BeeSetup";

export const setups = {
    [ROLE_FILLER]: {
        early: new BeeSetup(ROLE_FILLER, {
            ratio: ['c1', 'm1'],
            maxSize: Infinity
        }),

        default: new BeeSetup(ROLE_FILLER, {
            ratio: ['c2', 'm1'],
            padding: [CARRY, MOVE],
            maxSize: Infinity
        })
    },

    [ROLE_MINER]: {
        source: {
            base: {
                stage1: new BeeSetup(ROLE_MINER, {
                    ratio: ['w2', 'm1'],
                    maxSize: 1
                }),

                stage2: new BeeSetup(ROLE_MINER, {
                    ratio: ['w3', 'm3'],
                    maxSize: 1
                }),

                default: new BeeSetup(ROLE_MINER, {
                    ratio: ['w6', 'c1', 'm3'],
                    maxSize: 1
                }),

                heavy: new BeeSetup(ROLE_MINER, {
                    ratio: ['w20', 'c4', 'm10'],
                    maxSize: 1
                }),
            },

            outpost: {
                early: new BeeSetup(ROLE_MINER, {
                    ratio: ['w1', 'm1'],
                    maxSize: 5
                }),

                default: new BeeSetup(ROLE_MINER, {
                    ratio: ['w6', 'm4', 'c2'],
                    maxSize: 1
                }),

                heavy: new BeeSetup(ROLE_MANAGER, {
                    ratio: ['w12', 'c4', 'm8'],
                    maxSize: 1
                })
            }
        },

        mineral: {
            default: new BeeSetup(ROLE_MINER, {
                ratio: ['w4', 'm1'],
                maxSize: Infinity
            })
        }
    },

    [ROLE_CARRIER]: {
        default: new BeeSetup(ROLE_CARRIER, {
            ratio: ['c2', 'm1'],
            padding: [CARRY, MOVE],
            maxSize: Infinity
        }),
    },

    [ROLE_UPGRADER]: {
        default: new BeeSetup(ROLE_UPGRADER, {
            ratio: ['w1', 'c1', 'm1'],
            maxSize: Infinity
        }),

        heavy: new BeeSetup(ROLE_UPGRADER, {
            ratio: ['w2', 'c1', 'm1'],
            maxSize: Infinity,
        }),

        final: new BeeSetup(ROLE_UPGRADER, {
            ratio: ['w1', 'c1', 'm1'],
            maxSize: 15
        }),
    },

    [ROLE_WORKER]: {
        early: new BeeSetup(ROLE_WORKER, {
            ratio: ['w1', 'c1', 'm2'],
            maxSize: Infinity
        }),
        default: new BeeSetup(ROLE_WORKER, {
            ratio: ['w1', 'c1', 'm1'],
            maxSize: Infinity
        }),
    },

    [ROLE_MANAGER]: {
        default: new BeeSetup(ROLE_MANAGER, {
            ratio: ['c2', 'm1'],
            maxSize: 15
        })
    },

    [ROLE_SCOUT]: {
        default: new BeeSetup(ROLE_SCOUT, {
            ratio: ['m1'],
            maxSize: 1
        })
    },

    [ROLE_RESERVER]: {
        default: new BeeSetup(ROLE_RESERVER, {
            ratio: ['C1', 'm1'],
            maxSize: 6
        })
    },

    [ROLE_PIONEER]: {
        default: new BeeSetup(ROLE_PIONEER, {
            ratio: ['w1', 'c1', 'm2'],
            maxSize: Infinity
        })
    },

    [ROLE_CLAIMER]: {
        default: new BeeSetup(ROLE_CLAIMER, {
            ratio: ['m5', 'C1'],
            maxSize: 1
        })
    },

    [ROLE_DE_INVADER]: {
        default: new BeeSetup(ROLE_DE_INVADER, {
            ratio: ['t1', 'r2', 'm4', 'h1'],
            maxSize: 2
        })
    },

    [ROLE_DE_INVADER_CORE]: {
        default: new BeeSetup(ROLE_DE_INVADER_CORE, {
            ratio: ['a1', 'm1'],
            maxSize: Infinity
        })
    },

    [ROLE_DISMANTLER]: {
        default: new BeeSetup(ROLE_DISMANTLER, {
            ratio: ['w1', 'm1'],
            maxSize: Infinity
        })
    },

    [ROLE_DRONE]: {
        default: new BeeSetup(ROLE_DRONE, {
            ratio: ['w4', 'm1'],
            maxSize: Infinity
        })
    }
}