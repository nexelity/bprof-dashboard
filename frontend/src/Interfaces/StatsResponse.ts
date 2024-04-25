export interface StatsResponse {
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