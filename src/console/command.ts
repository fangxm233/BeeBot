import { BeeBot } from "BeeBot/BeeBot";

export class Command {
    public static run() {
        for (const name in Game.flags) {
            const flag = Game.flags[name];
            if (flag.name.match('outpost')) {
                const from = flag.name.split('_')[1];
                if (from) BeeBot.goOutpost(from, flag.pos.roomName);
                flag.remove();
                continue;
            }
        }
    }
}