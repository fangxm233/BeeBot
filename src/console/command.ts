import { BeeBot } from 'BeeBot/BeeBot';
import { PROCESS_DISMANTLE } from 'declarations/constantsExport';
import { ProcessColonize } from 'process/instances/colonize';
import { ProcessDismantle } from 'process/instances/dismantle';
import { Process } from 'process/Process';

export class Command {
    public static run() {
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
        }
    }
}