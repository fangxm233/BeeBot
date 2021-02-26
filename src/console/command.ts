import { BeeBot } from 'BeeBot/BeeBot';
import { PROCESS_DISMANTLE } from 'declarations/constantsExport';
import { ProcessColonize } from 'process/instances/colonize';
import { ProcessDismantle } from 'process/instances/dismantle';
import { Process } from 'process/Process';

export class Command {
    public static commandReset() {
        global.resourceStat=(resourceType?:ResourceConstant, split:boolean = false)=>{
            
            if(resourceType)
            {
                let num=0
                Object.values(Game.rooms).forEach(room=>{
                    let singleRoom=0
                    if(room.storage)
                    {
                        num+=room.storage.store[resourceType]
                        singleRoom+=room.storage.store[resourceType]
                    }
                    if(room.terminal)
                    {
                        num+=room.terminal.store[resourceType]
                        singleRoom+=room.terminal.store[resourceType]
                    }
                    if(split && singleRoom != 0)
                    {
                        console.log(`[resourceStat]房间${room.name}有${singleRoom}个${resourceType}`)
                    }
                })
                console.log(`[resourceStat]全房总共有${num}个${resourceType}`)
            }
            else
            {
                const result=[]
                Object.values(Game.rooms).forEach(room => {
                    
                    if(room.storage)
                    {
                        Object.keys(room.storage.store).forEach(resourceType=>{
                            if(result[resourceType]==undefined)result[resourceType]=0
                            result[resourceType]=result[resourceType]+(room.storage?.store[resourceType]||0)
                        })
                    }
                    if(room.terminal)
                    {
                        Object.keys(room.terminal.store).forEach(resourceType=>{
                            if(result[resourceType]==undefined)result[resourceType]=0
                            result[resourceType]=result[resourceType]+(room.terminal?.store[resourceType]||0)
                        })
                    }
                });
                for(const resourceType in result){
                    console.log(`[resourceStat]全房共有${result[resourceType]}个${resourceType}`)
                }
            }
            
        }
    }
    public static runFlag() {
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
}