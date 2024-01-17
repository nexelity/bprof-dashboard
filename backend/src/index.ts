import express, {Express, Request, Response} from "express";
import dotenv from "dotenv";
import {TraceRepository} from "./repositories/TraceRepository";
import cors from "cors";
import cache from "memory-cache";
import zlib from 'zlib';
import BprofLib, {BprofData} from "./services/BprofLib";
import phpUnserialize from 'phpunserialize';

dotenv.config({path: __dirname + "/../../.env"})

const app: Express = express();
app.use(cors());

const port = 31337;
const repo = TraceRepository.getInstance();

app.get("/", (_req: Request, res: Response) => {
    res.json({
        service: "bprof",
        version: "1.4"
    });
});

app.get("/trace", async (req: Request, res: Response) => {
    res.json(
        await repo.getTracesPaginated(
            req.query.search as string,
            req.query.date_from as string,
            req.query.date_to as string,
            parseInt(req.query.page as string) || 1,
            parseInt(req.query.rowCount as string) || 15,
            parseInt(req.query.minDuration as string) || 0
        )
    );
});

const decompressData = async (compressedData: string) => {
    return new Promise((resolve, reject) => {
        zlib.unzip(compressedData, (err, buffer) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(buffer.toString());
        });
    });
};

app.get("/trace/:traceId", async (req: Request, res: Response) => {
    const trace = await repo.getTraceById(req.params.traceId);

    if (!trace) {
        return res.status(404).json({
            error: "Trace not found"
        });
    }

    let bprof = new BprofLib;
    let decompressed = await decompressData(trace.perfdata as string);

    // @ts-ignore
    trace.perfdata = phpUnserialize(await decompressData(trace.perfdata as string) as string) as BprofData
    // @ts-ignore
    trace.headers = phpUnserialize(trace.headers as string) as BprofData
    // @ts-ignore
    trace.cookie = phpUnserialize(trace.cookie as string) as BprofData
    // @ts-ignore
    trace.get = phpUnserialize(trace.get as string) as BprofData
    // @ts-ignore
    trace.post = phpUnserialize(trace.post as string) as BprofData

    bprof.initMetrics(trace.perfdata as BprofData);

    let flat = bprof.computeFlatInfo(trace.perfdata);

    res.json({
        trace: trace,
        totals: flat.totals,
        symbols: flat.symbols
    });
});


app.get("/stats", async (req: Request, res: Response) => {
    let statsCache = cache.get("stats");
    if (statsCache) {
        return res.json(statsCache);
    }

    // Update stats in background
    const newStatsCache = {
        total: await repo.getTracesCount(),
        last_24h: await repo.getTracesCount24h(),
        stats: await repo.getTraceStats(),
        stats_by_day: await repo.getTraceStatsByDay()
    };
    cache.put("stats", newStatsCache, 1000 * 60);
    return res.json(newStatsCache);
});

app.listen(port, () => {
    console.log(`[server]: Server is running on port ${port}`);
});