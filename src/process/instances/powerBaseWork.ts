import { PROCESS_POWER_BASE_WORK, ROLE_POWER_PEACE } from 'declarations/constantsExport';
import { Process } from 'process/Process';
import { profile } from 'profiler/decorator';

@profile
export class ProcessPowerBaseWork extends Process {
    public tasks:PowerConstant[];
    constructor(roomName: string, tasks: PowerConstant[]) {
        super(roomName, PROCESS_POWER_BASE_WORK);
    }

    public static getInstance(proto: protoProcessPowerBaseWork,roomName: string) {
        return new ProcessPowerBaseWork(roomName,proto.tasks);
    }

    public getProto() {
        return { task: this.tasks };
    }
    

    public run() {
        this.foreachBee(ROLE_POWER_PEACE, bee => bee.run());
    }
}