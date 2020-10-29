import { ROLE_FILLER, ROLE_MINER } from "Bee/BeeFactory";
import { ProcessBoost } from "./instances/boost";
import { ProcessFilling } from "./instances/filling"
import { ProcessMineSource } from "./instances/mineSource";
import { Process } from "./Process"
import { PROCESS_BOOST, PROCESS_FILLING, PROCESS_MINE_SOURCE } from "./Processes";

// 注册的顺序将决定优先级
Process.registerProcess(PROCESS_FILLING, Bucket.bottom, ProcessFilling, 100, [ROLE_FILLER]);
Process.registerProcess(PROCESS_MINE_SOURCE, Bucket.level2, ProcessMineSource, 100, [ROLE_MINER]);
