import { ROLE_CARRIER, ROLE_FILLER, ROLE_MANAGER, ROLE_MINER } from "Bee/BeeFactory";
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
            early: new BeeSetup(ROLE_MINER, {
                ratio: ['w2', 'c1', 'm1'],
                maxSize: 1
            }),

            default: new BeeSetup(ROLE_MINER, {
                ratio: ['w6', 'c1', 'm3'],
                maxSize: 1
            }),

            outpost: new BeeSetup(ROLE_MINER, {
                ratio: ['w6', 'm3', 'c1'],
                maxSize: 2
            }),

            heavy: new BeeSetup(ROLE_MINER, {
                ratio: ['w20', 'c4', 'm10'],
                maxSize: 1
            }),
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

        outpost: new BeeSetup(ROLE_CARRIER, {
            ratio: ['c2', 'm1'],
            padding: [CARRY, MOVE],
            maxSize: Infinity
        }),
    },

    [ROLE_MANAGER]: {
        default: new BeeSetup(ROLE_MANAGER, {
            ratio: ['c2', 'm1'],
            maxSize: 15
        })
    }
}