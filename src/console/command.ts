import { BeeBot } from 'BeeBot/BeeBot';
import { log } from 'console/log';
import { PROCESS_DISMANTLE } from 'declarations/constantsExport';
import { ProcessColonize } from 'process/instances/colonize';
import { ProcessDismantle } from 'process/instances/dismantle';
import { Process } from 'process/Process';

export class Command {
    public static executeFlags() {
        for (const name in Game.flags) {
            const flag = Game.flags[name];
            const snips = name.split('_');
            if (flag.name == 'cancelOutpost') {
                const to = flag.pos.roomName;
                for (const roomName in Memory.beebot.outposts) {
                    const outposts = Memory.beebot.outposts[roomName];
                    if (_.contains(outposts, to)) {
                        BeeBot.cancelOutpost(roomName, to);
                    }
                }
                flag.remove();
                continue;
            }
            if (snips[0] == 'outpost') {
                const from = flag.name.split('_')[1];
                if (from) BeeBot.goOutpost(from, flag.pos.roomName);
                flag.remove();
                continue;
            }
            if (snips[0] == 'colony') {
                Process.startProcess(new ProcessColonize(flag.pos.roomName, snips[1]));
                flag.remove();
                continue;
            }
            if (snips[0] == 'dismantle') {
                if (!Process.getProcess<ProcessDismantle>(snips[1], PROCESS_DISMANTLE, 'target', flag.pos.roomName))
                    Process.startProcess(new ProcessDismantle(snips[1], flag.pos.roomName));
                continue;
            }
            if (snips[0] == 'unclaim') {
                flag.remove();
                BeeBot.unclaimColony(flag.pos.roomName);
                continue;
            }
            if (snips[0] == 'disable') {
                const processes = Process.getProcesses<Process>(flag.pos.roomName, snips[1] as ProcessTypes);
                if (!processes.length) continue;
                processes.forEach(process => process.suspend());
                flag.remove();
                continue;
            }
            if (snips[0] == 'enable') {
                const processes = Process.getProcesses<Process>(flag.pos.roomName, snips[1] as ProcessTypes);
                if (!processes.length) continue;
                processes.forEach(process => process.awake());
                flag.remove();
                continue;
            }
        }
    }

    /**
     * command func resourceStat(),用于检测全房特定/全部resource的数量,方便管控全局
     * @param resourceType 指定resource种类
     * @param split 是否分房间输出
     */
    public static resourceStat(resourceType?: ResourceConstant, split: boolean = false) {
        if (resourceType) {
            // 单resource种类输出
            let total = 0;

            _.forEach(Game.rooms, room => {
                let singleRoom = 0;
                if (room.storage) {
                    total += room.storage.store[resourceType];
                    singleRoom += room.storage.store[resourceType];
                }
                if (room.terminal) {
                    total += room.terminal.store[resourceType];
                    singleRoom += room.terminal.store[resourceType];
                }
                if (split && singleRoom != 0) {
                    log.info(`[resourceStat] Room ${room.name} has ${singleRoom} ${resourceType}`);
                }
            });

            log.info(`[resourceStat]Total ${resourceType}: ${total}`);
        } else {
            // 全部resource输出
            const stat = {};
            _.forEach(Game.rooms, room => {
                if (room.storage) {
                    Object.keys(room.storage.store).forEach(resourceType => {
                        if (!stat[resourceType]) stat[resourceType] = 0;
                        stat[resourceType] += (room.storage!.store[resourceType] || 0);
                    });
                }
                if (room.terminal) {
                    Object.keys(room.terminal.store).forEach(resourceType => {
                        if (!stat[resourceType]) stat[resourceType] = 0;
                        stat[resourceType] += (room.terminal!.store[resourceType] || 0);
                    });
                }
            });

            _.forEach(stat, (count, resourceType) => {
                log.info(`[resourceStat]Totally stored ${stat[resourceType!]} ${resourceType}`);
            });
        }

    };
}

// 挂载全局函数
global.resourceStat = Command.resourceStat;