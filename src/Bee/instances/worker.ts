import { Bee } from "Bee/Bee";
import { profile } from "profiler/decorator";
import { ResourcesManager } from "resourceManagement/ResourcesManager";
import { Tasks } from "tasks/Tasks";

@profile
export class BeeWorker extends Bee {

    public runCore() {
        this.task?.isValid();
        if (!this.task) {
            if (!this.store.energy) {
                this.task = ResourcesManager.getEnergySource(this, false);
            } else {
                this.chooseWork();
            }
        }
        this.task?.run();
    }

    private chooseWork() {
        const spawnRoom = Game.rooms[this.creep.room.name];
        const controller = spawnRoom.controller;
        if (controller && controller.ticksToDowngrade <= (controller.level >= 4 ? 10000 : 2000))
            if (this.upgradeAction()) return;

        const repairList = _.filter(this.creep.room.structures, structure => structure.structureType != STRUCTURE_RAMPART
            && structure.structureType != STRUCTURE_WALL && structure.hits < structure.hitsMax * 0.1);
        if (repairList.length)
            if (this.repairAction(repairList)) return;

        const buildSites = this.creep.room.find(FIND_CONSTRUCTION_SITES);
        if (buildSites.length)
            if (this.buildAction(buildSites)) return;

        if (this.upgradeAction()) return;
    }

    private buildAction(buildSites: ConstructionSite[]): boolean {
        if (!buildSites.length) return false;
        const target = this.creep.pos.findClosestByMultiRoomRange(buildSites);
        if (!target) return false;
        this.task = Tasks.build(target);
        return true;
    }

    private repairAction(repairList: Structure[]): boolean {
        if (!repairList.length) return false;
        const target = this.creep.pos.findClosestByRange(repairList);
        if (!target) return false;
        this.task = Tasks.repair(target);
        return true;
    }

    private upgradeAction(): boolean {
        const controller = Game.rooms[this.process.roomName].controller;
        if (controller) {
            this.task = Tasks.upgrade(controller);
            return true;
        }
        return false;
    }
}