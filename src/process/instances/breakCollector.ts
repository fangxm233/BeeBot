import { setups } from 'beeSpawning/setups';
import { WishManager } from 'beeSpawning/WishManager';
import { PROCESS_BREAK_COLLECTOR, ROLE_BREAKER } from 'declarations/constantsExport';
import { Process } from 'process/Process';
import { profile } from 'profiler/decorator';

@profile
export class ProcessBreakCollector extends Process {
    public target: string;

    constructor(roomName: string, target: string) {
        super(roomName, PROCESS_BREAK_COLLECTOR);
        this.wishManager = new WishManager(roomName, target, this);
        this.wishManager.setDefault('budget', Infinity);
        this.wishManager.setDefault('role', ROLE_BREAKER);
        this.wishManager.setDefault('setup', setups[ROLE_BREAKER].default);
        this.target = target;
    }

    public get memory(): protoProcessBreakCollector {
        return super.memory as protoProcessBreakCollector;
    }

    protected getProto(): any {
        return { target: this.target };
    }

    public static getInstance(proto: protoProcessBreakCollector, roomName: string) {
        return new ProcessBreakCollector(roomName, proto.target);
    }

    public run() {
        const flags = _.filter(Game.flags, flag => flag.name.split('_')[0] == 'b');
        if (!flags.length) this.close();

        this.foreachBee(ROLE_BREAKER, bee => bee.run());
    }

    public wishCreeps() {
        let count = 1;
        const room = Game.rooms[this.target];
        if (room) {
            const flags = _.filter(Game.flags, flag => {
                if (flag.name.split('_')[0] != 'b') return false;
                const structure = flag.pos.lookForStructure(STRUCTURE_WALL);
                return !!structure;
            });
            if (!flags.length) return;

            const flag = _.min(flags, flag => flag.name.split('_')[1]);
            const structure = flag.pos.lookForStructure(STRUCTURE_WALL)!;
            count = structure.pos.availableNeighbors(true, false).length;
        }
        const nowCount = this.getCreepAndWishCount(ROLE_BREAKER);
        if (nowCount < count) this.wishManager.wishBee({ count: count - nowCount });
    }
}

(global as any).ProcessBreakCollector = ProcessBreakCollector;