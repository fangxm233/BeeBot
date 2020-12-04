import { BeeBot } from "BeeBot/BeeBot";

export class Command {
    public static run() {
        for (const name in Game.flags) {
            const flag = Game.flags[name];
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
            if (flag.name.match('outpost')) {
                const from = flag.name.split('_')[1];
                if (from) BeeBot.goOutpost(from, flag.pos.roomName);
                flag.remove();
                continue;
            }
        }
    }
}