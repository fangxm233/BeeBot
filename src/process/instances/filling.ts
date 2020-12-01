import { ROAD_CONSTRUCT_RCL } from "basePlanner/BaseConstructor";
import { structureLayout } from "basePlanner/structurePreset";
import { ROLE_FILLER } from "Bee/BeeFactory";
import { BeeFiller } from "Bee/instances/filler";
import { BeeSetup } from "beeSpawning/BeeSetup";
import { setups } from "beeSpawning/setups";
import { WishManager } from "beeSpawning/WishManager";
import { Intel } from "dataManagement/Intel";
import { event } from "event/Event";
import { Process } from "process/Process";
import { PROCESS_FILLING } from "process/Processes";
import { profile } from "profiler/decorator";

@profile
export class ProcessFilling extends Process {
    public energyEnough = true;
    public count: number;
    private setup: BeeSetup;
    private inited: boolean;

    constructor(roomName: string) {
        super(roomName, PROCESS_FILLING);
        this.wishManager = new WishManager(roomName, roomName, this);
        event.addEventListener('onRclUpgrade', () => this.chooseSetup() && this.judgeCount());
    }

    public static getInstance(proto: protoProcessFilling, roomName: string): ProcessFilling {
        return new ProcessFilling(roomName);
    }

    public awake() {
        super.awake();
        this.foreachBee(ROLE_FILLER, bee => bee.unlock());
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

        if (_.every(this.bees[ROLE_FILLER], bee => bee.locked)) this.wait();
    }

    private init(): boolean {
        this.wishManager.setDefault('role', ROLE_FILLER);
        this.wishManager.setDefault('budget', Infinity);
        return this.chooseSetup() && this.judgeCount();
    }

    private chooseSetup(): boolean {
        const data = Intel.getRoomIntel(this.roomName);
        if (!data) return false;
        if (data.rcl! >= ROAD_CONSTRUCT_RCL) this.setup = setups[ROLE_FILLER].default;
        else this.setup = setups[ROLE_FILLER].early;
        return true;
    }

    private judgeCount(): boolean {
        const data = Intel.getRoomIntel(this.roomName);
        if (!data) return false;
        this.count = structureLayout[data.rcl!].buildings[STRUCTURE_CONTAINER].length;
        return true;
    }

    public wishCreeps() {
        if (!this.inited && !this.init()) return;
        this.wishManager.clear();

        this.wishManager.arrangeCyclingBees(ROLE_FILLER, this.setup, Infinity, ['i']);
        for (let i = 0; i < this.count; i++) {
            if (!_.find(this.bees[ROLE_FILLER], (bee: BeeFiller) => bee.memory.i == i)) {
                this.wishManager.wishBee({ setup: this.setup, extraMemory: { i } });
            }
        }
    }
}