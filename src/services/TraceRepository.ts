import Database from "@/services/Database";
import {Trace} from "@/services/BprofLib";

const dbConfig = {
    host: process.env.DB_HOSTNAME as string,
    user: process.env.DB_USERNAME as string,
    port: parseInt(process.env.DB_PORT as string),
    database: process.env.DB_DATABASE as string,
    password: process.env.DB_PASSWORD as string
};

const traceRepository = Database.getInstance(dbConfig);

const TABLE_NAME = process.env.DB_TABLE_NAME;

export async function getTraceById(id: string) {
    return await traceRepository.queryFirst<Trace>(`
        SELECT id, uuid, url, method, status_code, perfdata, server_name, ajax, headers, \`cookie\`, \`get\`, \`post\`, pmu, wt, cpu, user_id, ip, created_at
        FROM ${TABLE_NAME}
        WHERE uuid = ?
    `, [id]);
}

export async function getTracesPaginated(
    search: string | null,
    date_from: string,
    date_to: string,
    page: number,
    rowCount: number
) {
    search = search ? `%${search}%` : '%';
    let params = [];

    let WHERE = "";

    if (search) {
        WHERE += `(CONCAT(method, " ", url, " ", status_code, " ", server_name, " ", user_id, " ", ip) LIKE ?)`;
        params.push(search);
    }

    if (date_from && date_to) {
        if (WHERE) WHERE += " AND ";
        WHERE += "(created_at BETWEEN UNIX_TIMESTAMP(STR_TO_DATE(?, '%Y-%m-%dT%H:%i')) AND UNIX_TIMESTAMP(STR_TO_DATE(?, '%Y-%m-%dT%H:%i')))";
        params.push(date_from, date_to);
    }


    return traceRepository.query<Trace[]>(`
        SELECT id, uuid, url, method, status_code, server_name, ajax, pmu, wt, cpu, user_id, ip, created_at
        FROM ${TABLE_NAME}
        WHERE ${WHERE}
        ORDER BY id DESC
        LIMIT ${rowCount}
        OFFSET ${(page-1)*rowCount}
    `, params);
}

export async function getTracesCount() {
    return await traceRepository.queryFirst<{count: number}>(`SELECT count(id) as count FROM ${TABLE_NAME}`)
}

export async function getTracesCount24h() {
    return await traceRepository.queryFirst<{count: number}>(`SELECT count(id) as count FROM ${TABLE_NAME}`)
}

export async function getTraceStats() {
    return await traceRepository.queryFirst<{count: number, avg: number, max: number}>(`
        SELECT count(id) as count, avg(wt) as avg, max(wt) as max
        FROM ${TABLE_NAME}
        WHERE created_at >= UNIX_TIMESTAMP() - 86400
    `);
}

export async function getTraceStatsByDay() {
    return await traceRepository.query<Trace[]>(`
        SELECT CAST(DATE(FROM_UNIXTIME(created_at)) as CHAR) AS day, COUNT(*) AS total_rows, MIN(wt) AS min_wt, AVG(wt) AS avg_wt, MAX(wt) AS max_wt
        FROM ${TABLE_NAME}
        GROUP BY day
        ORDER BY day
    `);
}