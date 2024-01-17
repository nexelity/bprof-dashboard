import mysql, {Pool} from 'mysql2/promise';

export interface DBConfig {
    host: string;
    user: string;
    port: number;
    password: string;
    database: string;
}

export default class Database {

    private static instance: Database;
    private pool: Pool;

    private constructor(config: DBConfig) {
        this.pool = mysql.createPool(config);
    }

    public static getInstance(config: DBConfig): Database {
        if (!Database.instance) {
            Database.instance = new Database(config);
        }
        return Database.instance;
    }

    public async query<T extends any[]>(sql: string, params?: any[]): Promise<T> {
        const [rows] = await this.pool.query<T>(sql, params);
        return rows;
    }

    public async queryFirst<T>(sql: string, params?: any[]): Promise<T> {
        const [rows] = await this.query<T[]>(sql, params);
        if (Array.isArray(rows)) return rows[0];
        return rows
    }

    public async close(): Promise<void> {
        await this.pool.end();
    }
}