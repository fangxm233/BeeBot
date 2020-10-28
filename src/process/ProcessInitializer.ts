import { ROLE_FILLER } from "Bee/BeeFactory";
import { ProcessFilling } from "./instances/filling"
import { Process } from "./Process"
import { PROCESS_FILLING } from "./Processes";

// 注册的顺序将决定优先级
Process.registerProcess(PROCESS_FILLING, Bucket.bottom, ProcessFilling, 100, [ROLE_FILLER]);
