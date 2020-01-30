import actionsCounter from './profiler/actionCounter';
import stats from './profiler/stats';

import { USE_ACTION_COUNTER } from 'config';
import { profile } from 'profiler/decorator';
import { ErrorMapper, reseted } from "./ErrorMapper";

export const loop = ErrorMapper.wrapLoop(() => {
    stats.reset();
    if(USE_ACTION_COUNTER) actionsCounter.init(true);

    stats.commit();
});

function globalReset(){
    console.log('global reset');    
}
