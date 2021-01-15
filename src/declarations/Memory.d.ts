interface Memory {
    MemVer: number;
    beebot: {
        outposts: {
            [roomName: string]: string[];
        },
        colonies: {
            [roomName: string]: {
                stage: ColonyStage,
                defending: boolean,
            }
        }
    }
    processes: {
        [processName: string]: {
            [roomName: string]: protoProcess[];
        };
    }
    settings: {
        log: {
            level: number,
            showSource: boolean,
            showTick: boolean,
        }
    }
    transport: {
        [roomName: string]: {
            des: string,
            type: ResourceConstant,
            amount: number,
        }
    }
}

interface RoomMemory {
    avoid: number;

    allot: { [type: number]: protoAllotUnit[]; };
}

interface CreepMemory {
    _path: string;
    task: protoTask | null;

    /**
     * arriveTick
     */
    AT?: number;

    /**
     * boosted
     */
    b?: number;
}

type BeeFillerMemory = CreepMemory & {
    i: number;
}

type BeeCarrierMemory = CreepMemory & {
    i: number,
    pos: RoomPosition,
    type: ResourceConstant,
}

type BeeMinerMemory = CreepMemory & {
    s: number;
}

type BeeScoutMemory = CreepMemory & {
    t?: string;
}

type BeeManagerMemory = CreepMemory & {
    transferTask?: {
        from: Id<StoreStructure>, to: Id<StoreStructure>,
        type: ResourceConstant, amount: number, drop?: boolean
    }
}

interface PowerCreepMemory {
    _trav: TravelData;
}