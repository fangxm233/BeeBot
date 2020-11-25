import { bees } from "Bee/Bee";
import { BeeFactorty, ROLE_MINER } from "Bee/BeeFactory";
import { BeeMiner } from "Bee/instances/miner";
import { setups } from "beeSpawning/setups";
import { WishConfig, WishManager } from "beeSpawning/WishManager";
import { Intel } from "dataManagement/Intel";
import { Process } from "process/Process";
import { profile } from "profiler/decorator";
import { coordToRoomPosition } from "utilities/helpers";

@profile
export class ProcessMineSource extends Process {
    public memory: protoProcessMineSource;
    public sources: RoomPosition[];
    public target: string;

    constructor(roomName: string, targetRoom: string) {
        super(roomName, PROCESS_MINE_SOURCE);
        this.wishManager = new WishManager(roomName, targetRoom, this);
        this.target = targetRoom;
        const intel = Intel.getRoomIntel(targetRoom);
        if (!intel) {
            Intel.requestRoomIntel(targetRoom);
            return;
        }
        this.sources = intel.sources!.map(coord => coordToRoomPosition(coord, targetRoom));
    }

    protected getProto() {
        return { target: this.target };
    }

    public static getInstance(proto: protoProcessMineSource, roomName: string) {
        return new ProcessMineSource(roomName, proto.target);
    }

    public run() {
        this.foreachBee(ROLE_MINER, bee => bee.run());
    }

    public wishCreeps() {
        this.wishManager.arrangeCyclingBees(ROLE_MINER, setups[ROLE_MINER].source.early, Infinity, ['s']);
        const beeCount = _.countBy(this.bees[ROLE_MINER], (bee: BeeMiner) => bee.memory.s);
        const wishCount = _.countBy(this.wishManager.wishes, wish => wish.extraMemory.s);
        this.sources.forEach((coord, index) => {
            const nowCount = (beeCount[index] || 0) + (wishCount[index] || 0);
            const count = 2;
            if (nowCount >= count) return;
            const config: WishConfig = { role: ROLE_MINER, setup: setups[ROLE_MINER].source.early, budget: Infinity, count: count - nowCount, extraMemory: { s: index } }
            this.wishManager.wishBee(config);
        });
    }
}