import { BeeFactorty, ROLE_FILLER } from "Bee/BeeFactory";
import { setups } from "beeSpawning/setups";
import { WishConfig, WishManager } from "beeSpawning/WishManager";
import { log } from "console/log";
import { Process } from "process/Process";
import { PROCESS_FILLING } from "process/Processes";
import { profile } from "profiler/decorator";

@profile
export class ProcessFilling extends Process {
    constructor(roomName: string) {
        super(roomName, PROCESS_FILLING);
        this.wishManager = new WishManager(roomName, roomName, this);
    }

    public static getInstance(proto: protoProcessFilling, roomName: string): ProcessFilling {
        return new ProcessFilling(roomName);
    }

    public check() {
        const room = Game.rooms[this.roomName];
        if (room) return room.energyAvailable < room.energyCapacityAvailable;
        else {
            this.close();
            return false;
        }
    }

    public run() {
        this.foreachBee(ROLE_FILLER, bee => bee.run());
    }

    public wishCreeps() {
        const config: WishConfig = { role: ROLE_FILLER, setup: setups[ROLE_FILLER].early, budget: Infinity };
        this.wishManager.arrangeCyclingBees(ROLE_FILLER, setups[ROLE_FILLER].early, Infinity);
        if (this.getCreepAndWishCount(ROLE_FILLER) == 0)
            this.wishManager.wishBee(config);
    }
}