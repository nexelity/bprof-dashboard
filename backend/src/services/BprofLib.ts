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

export class BprofLib {

    private stats: string[] = [];
    // private pcStats: string[] = [];
    private metrics: string[] = [];
    private sortableColumns: Record<string, boolean> = {};
    private sortCol: string = '';
    private displayCalls: boolean = false;

    initMetrics(bprofData: BprofData, repSymbol?: string, sort?: string): void {

        if (sort && this.sortableColumns[sort]) {
            this.sortCol = sort;
        } else if (sort) {
            console.log(`Invalid Sort Key ${sort} specified in URL`);
        }

        if (!bprofData['main()']?.wt) {
            if (this.sortCol === 'wt') {
                this.sortCol = 'samples';
            }
            this.displayCalls = false;
        } else {
            this.displayCalls = true;
        }

        if (repSymbol) {
            this.sortCol = this.sortCol.replace('excl_', '');
        }

        this.stats = this.displayCalls ? ['fn', 'ct', 'Calls%'] : ['fn'];
        const possibleMetrics = this.getPossibleMetrics();
        for (const metric in possibleMetrics) {
            if (bprofData['main()']?.[metric]) {
                this.metrics.push(metric);
                this.stats.push(metric, `I${possibleMetrics[metric][0]}%`, `excl_${metric}`, `E${possibleMetrics[metric][0]}%`);
            }
        }
    }

    computeInclusiveTimes(rawData: BprofData): SymbolTable {
        this.metrics = this.getMetrics(rawData);

        let symbolTab: SymbolTable = {};

        Object.entries(rawData).forEach(([parentChild, info]) => {
            const [parent, child] = this.parseParentChild(parentChild);

            if (parent === child) {
                throw new Error(`Error in Raw Data: parent & child are both: ${parent}`);
            }

            if (!symbolTab[child]) {
                // @ts-ignore
                symbolTab[child] = this.displayCalls ? {ct: info.ct} : {};

                this.metrics.forEach(metric => {
                    // @ts-ignore
                    symbolTab[child][metric] = info[metric];
                });
            } else {
                if (this.displayCalls) {
                    symbolTab[child].ct += info.ct;
                }

                this.metrics.forEach(metric => {
                    // @ts-ignore
                    symbolTab[child][metric] += info[metric];
                });
            }

            if (symbolTab[child]["callerMap"] === undefined) {
                symbolTab[child]["callerMap"] = {};
                symbolTab[child]["callers"] = 0;
            }

            if (parent != null) {
                symbolTab[child]["callerMap"][parent] = true;
                symbolTab[child]["callers"] = Object.keys(symbolTab[child]["callerMap"]).length
            }
        });

        return symbolTab;
    }

    private getPossibleMetrics(): Metrics {
        return {
            wt: ['Wall', 'microsecs', 'walltime'],
            ut: ['User', 'microsecs', 'user cpu time'],
            st: ['Sys', 'microsecs', 'system cpu time'],
            cpu: ['Cpu', 'microsecs', 'cpu time'],
            mu: ['MUse', 'bytes', 'memory usage'],
            pmu: ['PMUse', 'bytes', 'peak memory usage'],
            samples: ['Samples', 'samples', 'cpu time'],
        };
    }

    getMetrics(bprofData: BprofData): string[] {
        const possibleMetrics = this.getPossibleMetrics();
        this.metrics = [];
        for (const metric in possibleMetrics) {
            if (bprofData['main()']?.[metric]) {
                this.metrics.push(metric);
            }
        }
        return this.metrics;
    }

    getChildrenTable(perfData: BprofData): SymbolRelationTable {
        let childrenTab: SymbolRelationTable = {};
        Object.entries(perfData).forEach(([parentChild, info]) => {
            const [parent, child] = this.parseParentChild(parentChild);

            // Skip if parent or child is null
            if (!parent || !child) return;

            // Initialize children table for parent
            if (!childrenTab[parent]) {
                childrenTab[parent] = [];
            }

            // Add child to children table for parent
            childrenTab[parent].push(child);
        });
        return childrenTab;
    }

    getParentTable(perfData: BprofData): SymbolRelationTable {
        let parentTable: SymbolRelationTable = {};
        Object.entries(perfData).forEach(([parentChild, info]) => {
            const [parent, child] = this.parseParentChild(parentChild);

            // Skip if parent or child is null
            if (!parent || !child) return;

            // Initialize children table for parent
            if (!parentTable[child]) {
                parentTable[child] = [];
            }

            // Add child to children table for parent
            parentTable[child].push(parent);
        });
        return parentTable;
    }

    parseParentChild(parentChild: string): [string | null, string] {
        const ret = parentChild.split('>>>');
        return ret.length === 2 ? [ret[0], ret[1]] : [null, ret[0]];
    }

    computeFlatInfo(rawData: BprofData) {
        this.metrics = this.getMetrics(rawData);

        let overallTotals: MetricTotals = {
            ct: 0,
            wt: 0,
            ut: 0,
            st: 0,
            cpu: 0,
            mu: 0,
            pmu: 0,
            samples: 0,
        };

        // Compute inclusive times for each function
        let symbolTab: SymbolTable = this.computeInclusiveTimes(rawData);

        // Total metric value is the metric value for 'main()'
        this.metrics.forEach(metric => {
            // @ts-ignore
            overallTotals[metric] = symbolTab['main()'][metric];
        });

        // Initialize exclusive (self) metric value to inclusive metric value
        // and add up the total number of function calls
        Object.entries(symbolTab).forEach(([symbol, info]) => {
            this.metrics.forEach(metric => {
                // @ts-ignore
                symbolTab[symbol]['excl_' + metric] = symbolTab[symbol][metric];
            });
            if (this.displayCalls) {
                overallTotals.ct += info.ct;
            }
        });

        // Adjust exclusive times by deducting inclusive time of children
        Object.entries(rawData).forEach(([parentChild, info]) => {
            const [parent, _] = this.parseParentChild(parentChild);
            if (parent && symbolTab[parent]) {
                this.metrics.forEach(metric => {
                    // @ts-ignore
                    symbolTab[parent]['excl_' + metric] -= info[metric];
                });
            }
        });

        return {
            symbols: symbolTab,
            totals: overallTotals
        }
    }

}

export default BprofLib;
