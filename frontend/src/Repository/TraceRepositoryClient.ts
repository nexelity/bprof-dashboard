import {Trace} from "../Services/Bprof";

export class TraceRepositoryClient {

    static getHostName() {
        return process.env.API_HOSTNAME || 'http://localhost:31337';
    }

    static async getTraces(
        search: string | null,
        date_from: string | null,
        date_to: string | null,
        page: number | null,
        rowCount: number | null,
        minDuration: number | null
    ): Promise<TracePaginatedResponse> {
        const response = await fetch(
            `${TraceRepositoryClient.getHostName()}/trace?search=` + encodeURIComponent(search || "") +
            `&date_from=` + encodeURIComponent(date_from || "") +
            `&date_to=` + encodeURIComponent(date_to || "") +
            `&page=` + encodeURIComponent(page || 1) +
            `&rowCount=` + encodeURIComponent(rowCount || 25) +
            `&minDuration=` + encodeURIComponent(minDuration || 0)
        );
        return await response.json();
    }

    static async getTrace(id: string): Promise<TraceResponse> {
        const response = await fetch(`${TraceRepositoryClient.getHostName()}/trace/${id}`);
        return await response.json();
    }

    static async getStats(): Promise<StatsResponse> {
        const response = await fetch(`${TraceRepositoryClient.getHostName()}/stats`);
        return await response.json();
    }
}

interface TracePaginatedResponse extends Array<Trace> {
}

interface TraceResponse {
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
            callerMap: {[key: string]: boolean};
            excl_ct: number;
            excl_wt: number;
        }
    }
}

interface StatsResponse {
    total: {
        count: number;
    }
    last_24h: {
        count: number;
    }
    stats: {
        count: number;
        avg: number;
        max: number;
    }
    stats_by_day: Array<{
        day: string;
        total_rows: number;
        min_wt: number;
        avg_wt: number;
        max_wt: number;
    }>
}