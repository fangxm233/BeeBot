import { bees } from "Bee/Bee";
import { BeeFactorty, ROLE_MINER } from "Bee/BeeFactory";
import { BeeMiner } from "Bee/instances/miner";
import { setups } from "beeSpawning/setups";
import { WishManager } from "beeSpawning/WishManager";
import { Process } from "Process/Process";
import { PROCESS_MINE_SOURCE } from "process/Processes";
import { profile } from "profiler/decorator";

@profile
export class ProcessMineSource extends Process {
    private sources: Source[];

    constructor(roomName: string, targetRoom: string) {
        console.log('hello?');
        super(roomName, PROCESS_MINE_SOURCE);
        this.wishManager = new WishManager(roomName, targetRoom, this);
        const room = Game.rooms[targetRoom];
        if (!room) return; // TODO: 从Intel获取source信息
        this.sources = room.sources.sort((a, b) => a.id.localeCompare(b.id));
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

        this.sources.forEach((source, index) => {
            if (beeCount[index] + wishCount[index] > 0) return;
            this.wishManager.wishBee(BeeFactorty.getInstance(ROLE_MINER, this), setups[ROLE_MINER].source.early, Infinity, { s: index });
        });
    }
}
// (global as any).ProcessMineSource = ProcessMineSource;