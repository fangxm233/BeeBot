import { bees } from "Bee/Bee";
import { BeeFactorty, ROLE_MINER } from "Bee/BeeFactory";
import { BeeMiner } from "Bee/instances/miner";
import { setups } from "beeSpawning/setups";
import { WishManager } from "beeSpawning/WishManager";
import { Process } from "process/Process";
import { PROCESS_MINE_SOURCE } from "process/Processes";
import { profile } from "profiler/decorator";

@profile
export class ProcessMineSource extends Process {
    public memory: protoProcessMineSource;
    public sources: Id<Source>[];
    public target: string;

    constructor(roomName: string, targetRoom: string) {
        super(roomName, PROCESS_MINE_SOURCE);
        this.wishManager = new WishManager(roomName, targetRoom, this);
        this.target = targetRoom;
        const room = Game.rooms[targetRoom];
        if (!room) return; // TODO: 从Intel获取source信息
        this.sources = room.sources.sort((a, b) => a.id.localeCompare(b.id)).map(source => source.id);
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
        this.sources.forEach((id, index) => {
            const nowCount = (beeCount[index] || 0) + (wishCount[index] || 0);
            const count = 3;
            if (nowCount >= count) return;
            this.wishManager.wishBee(BeeFactorty.getInstance(ROLE_MINER, this), setups[ROLE_MINER].source.early, Infinity, count - nowCount, { s: index });
        });
    }
}