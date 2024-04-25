import {Trace} from "../Services/Bprof";

export interface TraceResponse {
    trace: Trace,
    totals: {
        ct: number;
        wt: number;
        ut: number;
        st: number;
        cpu: number;
        mu: number;
        pmu: number;
        samples: number;
    },
    symbols: {
        [key: string]: {
            ct: number;
            wt: number;
            ut: number;
            st: number;
            cpu: number;
            mu: number;
            pmu: number;
            samples: number;
            callers: number;
            callerMap: { [key: string]: boolean };
            excl_ct: number;
            excl_wt: number;
        }
    }
}