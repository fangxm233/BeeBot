import { BaseConstructor } from "basePlanner/BaseConstructor";
import { Bee } from "Bee/Bee";
import { profile } from "profiler/decorator";

@profile
export class BeeManager extends Bee {
    private centerLinkId: Id<StructureLink>;
    private upgradeLinkId: Id<StructureLink>;

    public runCore() {
        const constructor = BaseConstructor.get(this.room.name);
        const storage = this.room.storage;
        const controller = this.room.controller!;
        if (!storage) return;

        if (!this.centerLinkId)
            this.centerLinkId = this.room.links.filter(link => link.pos.inRangeTo(storage, 2))[0]?.id!;
        if (!this.upgradeLinkId)
            this.upgradeLinkId = this.room.links.filter(link => link.pos.inRangeTo(controller, 2))[0]?.id!;
        const centerLink = Game.getObjectById(this.centerLinkId);
        if (centerLink) {
            const upgradeLink = Game.getObjectById(this.upgradeLinkId);
            if (upgradeLink && upgradeLink.store.energy < 600) {
                const remain = upgradeLink.store.getFreeCapacity(RESOURCE_ENERGY) - centerLink.store.energy;
                if (remain <= 0) {
                    centerLink.transferEnergy(upgradeLink);
                    return;
                }
                if (!this.store.energy) {
                    this.getEnergy(remain);
                    return;
                }
                this.transferEnergy(centerLink, remain);
            }
        }
    }

    private getEnergy(amount?: number) {
        if (!this.pos.isNearTo(this.room.storage!)) this.travelTo(this.room.storage!);
        else this.withdraw(this.room.storage!, RESOURCE_ENERGY, amount);
    }

    private transferEnergy(target: Structure, amount?: number) {
        if (!this.pos.isNearTo(target)) this.travelTo(target);
        else this.transfer(target, RESOURCE_ENERGY, amount);
    }
}