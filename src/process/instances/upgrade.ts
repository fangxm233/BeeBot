import { BeeFactorty, ROLE_UPGRADER } from "Bee/BeeFactory";
import { setups } from "beeSpawning/setups";
import { WishConfig, WishManager } from "beeSpawning/WishManager";
import { Process } from "process/Process";
import { PROCESS_UPGRADE } from "process/Processes";
import { profile } from "profiler/decorator";

@profile
export class ProcessUpgrade extends Process {
    constructor(roomName: string) {
        super(roomName, PROCESS_UPGRADE);
        this.wishManager = new WishManager(roomName, roomName, this);
    }

    public static getInstance(proto: protoProcess, roomName: string) {
        return new ProcessUpgrade(roomName);
    }

    public run() {
        this.foreachBee(ROLE_UPGRADER, bee => bee.run());
    }

    public wishCreeps() {
        const nowCount = this.getCreepAndWishCount(ROLE_UPGRADER);
        const count = 0;
        const config: WishConfig = { role: ROLE_UPGRADER, setup: setups[ROLE_UPGRADER].default, budget: Infinity, count: count - nowCount }
        if (nowCount < count) {
            this.wishManager.wishBee(config);
        }
    }
}