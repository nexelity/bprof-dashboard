import {TraceResponse} from "../Interfaces/TraceResponse";
import {StatsResponse} from "../Interfaces/StatsResponse";
import {TracePaginatedResponse} from "../Interfaces/TracePaginatedResponse";

export class TraceRepositoryClient {

    static getHostName() {
        const currentProtocol = window.location.protocol;
        const currentHostname = window.location.hostname;
        const newPort = 31337;
        return `${currentProtocol}//${currentHostname}:${newPort}`;
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

