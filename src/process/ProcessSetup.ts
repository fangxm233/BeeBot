import { Process } from "./Process"
import { ProcessFilling } from "./instances/filling"

Process.registerProcess(PROCESS_FILLING, 1, Bucket.bottom, ProcessFilling);
