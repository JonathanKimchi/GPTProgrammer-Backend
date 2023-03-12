import { ChildProcess } from "child_process";

export interface BuildOutput {
    output: string;
    childProcess: ChildProcess;
    pid: number;
}
