export const MemoryVersion = 3;

export class Mem {
    public static checkAndInit() {
        if (!Memory.MemVer) this.initMemory();
        if (Memory.MemVer < MemoryVersion) {
            for (let i = Memory.MemVer; i < MemoryVersion; i++) {
                this.upgradeMemory(i);
            }
        }
    }

    public static initMemory() {
        delete (global as any).Memory;
        (global as any).Memory = {};
        (RawMemory as any)._parsed = (global as any).Memory;
        Memory.MemVer = MemoryVersion;

        Memory.processes = {};
        Memory.beebot = { outposts: {}, colonies: {} };
    }

    public static tryInitSameMemory(): boolean {
        if (global.lastMemoryTick && global.LastMemory && Game.time == (global.lastMemoryTick + 1)) {
            delete global.Memory;
            global.Memory = global.LastMemory;
            (RawMemory as any)._parsed = global.LastMemory;
            global.lastMemoryTick = Game.time;
            return true;
        } else {
            // tslint:disable-next-line: no-unused-expression
            Memory.rooms;
            global.LastMemory = (RawMemory as any)._parsed;
            global.lastMemoryTick = Game.time;
            return false;
        }
    }

    private static upgradeMemory(from: number) {
        if (from == 1) {
            Memory.beebot = { outposts: {}, colonies: {} };
        }
        if(from == 2) {
            Memory.beebot.colonies = {};
        }
        Memory.MemVer++;
    }
}