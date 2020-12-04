/**
 * @constant sleeping 休眠直到指定tick
 * @constant active 活跃的
 * @constant waiting 等待直到check函数返回true
 * @constant suspended 挂起直到唤醒
 */

type ProcessState = 'sp' | 'a' | 'w' | 'sd';

type ProcessTypes = 'filling'
    | 'mineSource'
    | 'boost'
    | 'upgrade'
    | 'baseWork'
    | 'scout'
    | 'tower'
    | 'reserving'
    | 'carry';

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
    EO: number;
};

type protoProcessBoost = protoProcess & {
    type: 'single' | 'lasting';
};

type protoProcessReserving = protoProcess & {
    target: string;
};

type protoProcessCarry = protoProcess & {
    target: string;
}