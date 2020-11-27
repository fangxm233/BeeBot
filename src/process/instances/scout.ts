import { ROLE_SCOUT } from "Bee/BeeFactory";
import { BeeScout } from "Bee/instances/scout";
import { setups } from "beeSpawning/setups";
import { WishManager } from "beeSpawning/WishManager";
import { Process } from "process/Process";
import { profile } from "profiler/decorator";

@profile
export class ProcessScout extends Process {
    private scoutRequests: string[];


    constructor(roomName: string) {
        super(roomName, PROCESS_SCOUT);
        this.wishManager = new WishManager(roomName, roomName, this);
    }

    public static getInstance(proto: protoProcess, roomName: string) {
        return new ProcessScout(roomName);
    }

    public run() {
        this.foreachBee(ROLE_SCOUT, bee => bee.run());
    }

    public handleRequests() {
        const bees = this.bees[ROLE_SCOUT] as BeeScout[];
        this.scoutRequests = this.scoutRequests.filter(
            roomName => !Game.rooms[roomName] && !bees.find(bee => bee.target == roomName));

        bees.forEach(bee => {
            if (!this.scoutRequests.length) return;
            const target = _.min(this.scoutRequests, roomName => Game.map.getRoomLinearDistance(roomName, bee.room.name));
            const d1 = Game.map.getRoomLinearDistance(target, bee.room.name);
            const d2 = Game.map.getRoomLinearDistance(target, this.roomName);
            if (d1 <= d2) {
                bee.arrangeTarget(target);
                _.remove(this.scoutRequests, roomName => roomName == target);
                return;
            } else {
                if (this.wishManager.getCount(ROLE_SCOUT)) return;
                this.wishManager.wishBee({ role: ROLE_SCOUT, setup: setups[ROLE_SCOUT].default, budget: Infinity });
            }
        })
    }

    public requestScout(roomName: string) {
        if (_.contains(this.scoutRequests, roomName)) return;
        this.scoutRequests.push(roomName);
    }
}