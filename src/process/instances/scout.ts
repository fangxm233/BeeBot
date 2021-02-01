import { BeeScout } from 'Bee/instances/scout';
import { setups } from 'beeSpawning/setups';
import { WishManager } from 'beeSpawning/WishManager';
import { PROCESS_SCOUT, ROLE_SCOUT } from 'declarations/constantsExport';
import { Process } from 'process/Process';
import { profile } from 'profiler/decorator';

const MAX_SCOUT_COUNT = 10;

@profile
export class ProcessScout extends Process {
    private scoutRequests: string[] = [];

    constructor(roomName: string) {
        super(roomName, PROCESS_SCOUT);
        this.wishManager = new WishManager(roomName, roomName, this);
        this.wishManager.setDefault('role', ROLE_SCOUT);
        this.wishManager.setDefault('setup', setups[ROLE_SCOUT].default);
        this.wishManager.setDefault('budget', Infinity);
    }

    public static getInstance(proto: protoProcess, roomName: string) {
        return new ProcessScout(roomName);
    }

    public run() {
        this.foreachBee(ROLE_SCOUT, bee => bee.run());

        this.handleRequests();
    }

    public handleRequests() {
        let bees = this.bees[ROLE_SCOUT] as BeeScout[];
        this.scoutRequests = this.scoutRequests.filter(
            roomName => !Game.rooms[roomName] && !bees.find(bee => bee.target == roomName));
        bees = bees.filter(bee => !bee.target);
        if(!this.scoutRequests.length) return;

        if (!bees.length) {
            if (this.wishManager.getCount(ROLE_SCOUT)) return;
            if (this.bees[ROLE_SCOUT].length >= MAX_SCOUT_COUNT) return;
            this.wishManager.wishBee({});
            return;
        }

        bees.forEach(bee => {
            if (!this.scoutRequests.length) return;
            const target = _.min(this.scoutRequests, roomName => Game.map.getRoomLinearDistance(roomName, bee.room.name));
            const d1 = Game.map.getRoomLinearDistance(target, bee.room.name);
            const d2 = Game.map.getRoomLinearDistance(target, this.roomName);
            if (d1 <= d2 || this.bees[ROLE_SCOUT].length >= MAX_SCOUT_COUNT) {
                bee.arrangeTarget(target);
                _.remove(this.scoutRequests, roomName => roomName == target);
                return;
            } else {
                if (this.wishManager.getCount(ROLE_SCOUT)) return;
                this.wishManager.wishBee({});
            }
        });
    }

    public wishCreeps() {
        return;
    }

    public requestScout(roomName: string) {
        if (_.contains(this.scoutRequests, roomName)) return;
        this.scoutRequests.push(roomName);
    }
}