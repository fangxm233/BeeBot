import { PROCESS_POWER_BASE_WORK, ROLE_BASE_BOOSTER } from 'declarations/constantsExport';
import { Process } from 'process/Process';
import { profile } from 'profiler/decorator';

@profile
export class ProcessPowerBaseWork extends Process {
    public tasks: PowerConstant[] = [];

    constructor(roomName: string) {
        super(roomName, PROCESS_POWER_BASE_WORK);
    }

    public static getInstance(proto: protoProcessPowerBaseWork, roomName: string) {
        const process = new ProcessPowerBaseWork(roomName);
        process.tasks = proto.tasks;
        return process;
    }

    public getProto() {
        return { task: this.tasks };
    }


    public run() {
        this.foreachPowerBee(ROLE_BASE_BOOSTER, bee => bee.run());
    }
}