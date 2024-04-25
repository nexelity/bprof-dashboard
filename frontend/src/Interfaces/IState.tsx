import {Trace} from "../Services/Bprof";

export type TableRows = (object | string[] | number[])[] | any;

export interface IState {
    id: string;
    tableRows: TableRows,
    trace: Trace | null,
    totals: {
        ct: number;
        wt: number;
        ut: number;
        st: number;
        cpu: number;
        mu: number;
        pmu: number;
        samples: number;
    } | null,
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
    } | null,
    mysqlQueries: number;
    search: string;
}