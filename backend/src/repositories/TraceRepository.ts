import Database from "./Database";
import {Trace} from "../services/BprofLib";


export class TraceRepository {
    private static instance: TraceRepository;

    private db: Database;

    private constructor() {
        const dbConfig = {
            host: process.env.DB_HOSTNAME as string,
            user: process.env.DB_USERNAME as string,
            port: parseInt(process.env.DB_PORT as string),
            database: process.env.DB_DATABASE as string,
            password: process.env.DB_PASSWORD as string
        };

        this.db = Database.getInstance(dbConfig);
    }

    static getTableName() {
        return process.env.DB_TABLE_NAME as string;
    }

    public static getInstance(): TraceRepository {
        // Lazily instantiate
        if (!TraceRepository.instance) {
            TraceRepository.instance = new TraceRepository();
        }
        return TraceRepository.instance;
    }

    public async getTraceById(id: string) {
        return await this.db.queryFirst<Trace>(`
        SELECT id, uuid, url, method, status_code, perfdata, server_name, ajax, headers, \`cookie\`, \`get\`, \`post\`, pmu, wt, cpu, user_id, ip, created_at
        FROM ${TraceRepository.getTableName()}
        WHERE uuid = ?
    `, [id]);
    }

    public async getTracesPaginated(
        search: string | null,
        date_from: string | null,
        date_to: string | null,
        page: number,
        rowCount: number,
        minDuration: number
    ) {

        if (search === "null") search = null;
        if (date_from === "null") date_from = null;
        if (date_to === "null") date_to = null;
        if (page <= 0) page = 1;
        if (rowCount <= 0) rowCount = 1;

        search = search ? `%${search}%` : '%';
        let params = [];

        let WHERE = "";

        if (search) {
            WHERE += `(CONCAT_WS(method, " ", url, " ", status_code, " ", server_name, " ", user_id, " ", ip) LIKE ?)`;
            params.push(search);
        }


        if (minDuration > 0) {
            if (WHERE) WHERE += " AND ";
            WHERE += `(wt >= ?)`;
            params.push(minDuration*1000);
        }


        if (date_from && date_to) {
            if (WHERE) WHERE += " AND ";
            WHERE += "(created_at BETWEEN UNIX_TIMESTAMP(STR_TO_DATE(?, '%Y-%m-%dT%H:%i')) AND UNIX_TIMESTAMP(STR_TO_DATE(?, '%Y-%m-%dT%H:%i')))";
            params.push(date_from, date_to);
        }

        return this.db.query<Trace[]>(`
            SELECT id, uuid, url, method, status_code, server_name, ajax, pmu, wt, cpu, user_id, ip, created_at
            FROM ${TraceRepository.getTableName()}
            WHERE ${WHERE}
            ORDER BY id DESC
            LIMIT ${rowCount}
            OFFSET ${(page-1)*rowCount}
        `, params);
    }

    public async getTracesCount() {
        return await this.db.queryFirst<{count: number}>(`SELECT count(id) as count FROM ${TraceRepository.getTableName()}`)
    }

    public async getTracesCount24h() {
        return await this.db.queryFirst<{count: number}>(`
            SELECT count(id) as count FROM ${TraceRepository.getTableName()}
            WHERE DATE(FROM_UNIXTIME(created_at)) >= now() - INTERVAL 1 DAY
        `)
    }

    public async getTraceStats() {
        return await this.db.queryFirst<{count: number, avg: number, max: number}>(`
        SELECT count(id) as count, avg(wt) as avg, max(wt) as max
        FROM ${TraceRepository.getTableName()}
        WHERE created_at >= UNIX_TIMESTAMP() - 86400
    `);
    }

    public async getTraceStatsByDay() {
        return await this.db.query<Trace[]>(`
        SELECT DATE_FORMAT(FROM_UNIXTIME(created_at), "%d %b %H:00") AS day,
         COUNT(*) AS total_rows, MIN(wt) AS min_wt, AVG(wt) AS avg_wt, MAX(wt) AS max_wt
        FROM ${TraceRepository.getTableName()}
        WHERE DATE(FROM_UNIXTIME(created_at)) >= now() - INTERVAL 3 DAY
        GROUP BY day
        ORDER BY day
    `);
    }
}