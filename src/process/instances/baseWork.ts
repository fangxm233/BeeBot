import { ROLE_UPGRADER, ROLE_WORKER } from "Bee/BeeFactory";
import { setups } from "beeSpawning/setups";
import { WishConfig, WishManager } from "beeSpawning/WishManager";
import { Process } from "process/Process"
import { profile } from "profiler/decorator";

@profile
export class ProcessBaseWork extends Process {
    constructor(roomName: string) {
        super(roomName, PROCESS_BASE_WORK);
        this.wishManager = new WishManager(roomName, roomName, this);
    }

    public static getInstance(proto: protoProcess, roomName: string) {
        return new ProcessBaseWork(roomName);
    }

    public run() {
        this.foreachBee(ROLE_WORKER, bee => bee.run());
    }

    public wishCreeps() {
        const room = Game.rooms[this.roomName];
        const controller = room?.controller;
        if (!room || !controller) {
            this.close(true);
            return;
        }

        let bodies: BodyPartConstant[] | undefined = undefined;
        bodies = setups[ROLE_WORKER].early.generateCreepBody(room.energyCapacityAvailable);
        const MAX_WORKERS = 10;
        const buildSites = room.find(FIND_CONSTRUCTION_SITES);
        const buildTicks = _.sum(buildSites,
            site => Math.max(site.progressTotal - site.progress, 0)) / BUILD_POWER;
        let numWorkers = Math.ceil(2 * (5 * buildTicks) /
            (bodies.length / 3 * CREEP_LIFE_TIME));
        numWorkers = Math.min(numWorkers, MAX_WORKERS);
        if (controller.level < 4) numWorkers = Math.max(numWorkers, MAX_WORKERS);

        const nowCount = this.getCreepAndWishCount(ROLE_WORKER);
        const config: WishConfig = { role: ROLE_WORKER, setup: setups[ROLE_WORKER].default, budget: Infinity, count: numWorkers - nowCount }
        if (nowCount < numWorkers) {
            this.wishManager.wishBee(config);
        }
    }
}