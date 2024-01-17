export type BprofData = Record<string, Record<string, number>>;
export type MetricTotals = Record<string, number>;
export type SymbolTable = Record<string, Symbol>;
export type SymbolRelationTable = Record<string, string[]>;
export type Metrics = Record<string, any>;

export interface Symbol {
    ct: number;
    wt: number;
    ut: number;
    st: number;
    cpu: number;
    callers: number;
    callerMap: {[key: string]: boolean};
    mu: number;
    pmu: number;
    samples: number;
    excl_ct: number;
    excl_wt: number;
}

export interface Trace {
    id: string;
    uuid: string;
    url: string;
    method: "GET" | "POST" | "PATCH" | "OPTIONS" | "DELETE" | "PUT"
    status_code: number | null;
    server_name: string;
    perfdata: string | BprofData;
    ajax: string;
    headers: string;
    cookie: string;
    post: string;
    get: string;
    pmu: number;
    wt: number;
    cpu: number;
    user_id: string;
    ip: string;
    created_at: number;
}