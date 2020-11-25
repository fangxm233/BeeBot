/**
 * @constant sleeping 休眠直到指定tick
 * @constant active 活跃的
 * @constant waiting 等待直到check函数返回true
 * @constant suspended 挂起直到唤醒
 */

type ProcessState = 'sp' | 'a' | 'w' | 'sd';

type ProcessTypes = 'filling' | 'mineSource' | 'boost' | 'upgrade' | 'baseWork' | 'scout';

const PROCESS_FILLING = 'filling';
const PROCESS_MINE_SOURCE = 'mineSource';
const PROCESS_UPGRADE = 'upgrade';
const PROCESS_BASE_WORK = 'baseWork';
const PROCESS_BOOST = 'boost';
const PROCESS_SCOUT = 'scout';

interface protoProcess {
    st: ShortProcessState;
    slt?: number;
    p: string;
    sp: string[];
    bees: { [role: string]: string[] };
}

type protoProcessFilling = protoProcess & {

};

type protoProcessMineSource = protoProcess & {
    target: string;
};

type protoProcessBoost = protoProcess & {
    type: 'single' | 'lasting';
}