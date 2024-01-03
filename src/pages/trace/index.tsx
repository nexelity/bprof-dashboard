import './../../app/globals.css'
import * as React from 'react';
import TableContainer from '@mui/material/TableContainer';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import InfoIcon from '@mui/icons-material/Info';
import Typography from '@mui/material/Typography';
import Link from 'next/link'
import phpUnserialize from 'phpunserialize';
import zlib from 'zlib';
import {BprofData, BprofLib, Symbol, Trace} from "@/services/BprofLib";
import parse from 'html-react-parser'
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import {getTraceById} from "@/services/TraceRepository";
import MUIDataTable from "mui-datatables";
import Tooltip from '@mui/material/Tooltip';
import {IconButton} from "@mui/material";

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


export async function getServerSideProps(context: any) {

    let id = context.query["id"] ?? 0;
    let search = context.query["search"] ?? "";

    let trace = await getTraceById(id)
    let decompressed = await decompressData(trace.perfdata as string);

    // @ts-ignore
    trace.perfdata = phpUnserialize(decompressed) as BprofData
    trace.get = phpUnserialize(trace.get)
    trace.post = phpUnserialize(trace.post)
    trace.cookie = phpUnserialize(trace.cookie)
    trace.headers = phpUnserialize(trace.headers)
    let bprof: BprofLib = new BprofLib();
    bprof.initMetrics(trace.perfdata)
    let flat = bprof.computeFlatInfo(trace.perfdata)
    return {
        props: {
            trace,
            totals: flat.totals,
            symbols: flat.symbols,
            search
        }
    }
}

export default function Home(props: {
    trace: Trace,
    totals: Symbol,
    symbols: { [key: string]: Symbol },
    search: string
}) {

    // const sortedSymbols = Object.entries(props.symbols).sort((a, b) => b[1].excl_wt - a[1].excl_wt);
    const mysqlQueries = Object.keys(props.symbols).filter((key) => key.includes("PDOStatement::execute") || key.includes("PDO::exec")).map((key) => {
        return props.symbols[key].ct;
    }).reduce((a, b) => a + b, 0);

    const sortNumeric = (order: "asc" | "desc") => {
        return (a: any, b: any) => {
            let val1 = parseFloat(a.data.replace("ms", "").replace("%", "").replace(",", ""));
            let val2 = parseFloat(b.data.replace("ms", "").replace("%", "").replace(",", ""));
            return (val1 - val2) * (order === 'asc' ? 1 : -1);
        };
    }

    const tableColumns = [
        {
            name: "class",
            label: "class",
            options: {
                filter: true,
                sort: true,
                filterOptions: {
                    fullWidth: true,
                },
                display: 'excluded',
                viewColumns: false,
                download: false,
                print: false,
            }
        },
        {
            name: "method",
            label: "method",
            options: {
                filter: false,
                sort: true,
                display: 'excluded',
                viewColumns: false,
                download: false,
                print: false,
            }
        },
        {
            name: "symbol",
            label: "Symbol",
            options: {
                filter: false,
                sort: true,
                customBodyRender: (value, tableMeta, updateValue) => {
                    let [symbol, meta] = value.split("#");
                    let [clazz, method] = symbol.split("::");

                    return <>
                        <Link
                            href={"/trace-symbol/?id=" + props.trace.uuid + "&symbol=" + Buffer.from(value).toString('base64')}>
                        {method ? parse(clazz + "::<strong>" + method + "</strong>") : parse("<strong>" + clazz + "</strong>")}
                        </Link>
                        {meta ? (<Tooltip title={meta}><IconButton size={"small"}><InfoIcon /></IconButton></Tooltip>) : ""}
                        {/*{meta ? parse('<textarea>' + meta + '</textarea>') : ""}*/}
                    </>
                },
            },
        },
        {
            name: "call_count",
            label: "Call count",
            options: {
                hint: "The amount of times this method gets called",
                filter: false,
                sort: true,
                sortCompare: sortNumeric,
            }
        },
        {
            name: "called_by",
            label: "Called by",
            options: {
                hint: "The amount unique callers to this method",
                filter: false,
                sort: true,
            }
        },
        {
            name: "wall_time_inclusive",
            label: "Wall time (Inclusive)",
            options: {
                hint: "The amount of time spent in this method AND child methods.",
                filter: false,
                sort: true,
                sortCompare: sortNumeric,
            }
        },
        {
            name: "wall_time_exclusive",
            label: "Wall time (Exclusive)",
            options: {
                hint: "The amount of time spent in this method - excluding time in child methods.",
                filter: false,
                sort: true,
                sortCompare: sortNumeric,
            }
        },
        {
            name: "percent_of_time",
            label: "% of time",
            options: {
                hint: "The % of exclusive wall time this method took.",
                filter: false,
                sort: true,
                sortCompare: sortNumeric,
            }
        },
    ];

    Number.prototype.toFixedDown = function(digits) {
        var re = new RegExp("(\\d+\\.\\d{" + digits + "})(\\d)"),
            m = this.toString().match(re);
        return m ? parseFloat(m[1]) : this.valueOf();
    };

    const tableRows = Object.entries(props.symbols).map(([key, value]) => {
        let [symbol, meta] = key.split("#");
        let [clazz, method] = symbol.split("::");

        if (props.search && !key.toLowerCase().includes(props.search.toLowerCase())) {
            return null;
        }

        return [
            method ? clazz : null,
            method,
            key,
            value.ct.toLocaleString(),
            value.callers.toLocaleString(),
            Math.trunc(value.wt / 1000).toLocaleString() + "ms",
            Math.trunc(value.excl_wt / 1000).toLocaleString() + "ms",
            (value.excl_wt / props.totals.wt * 100).toFixedDown(2) + "%",
        ];
    }).filter((row) => row !== null);

    const tableOptions = {
        filterType: 'checkbox',
        searchAlwaysOpen: true,
        sortOrder: {"name": "wall_time_exclusive", "direction": "desc"},
        selectableRows: "none",
        // resizableColumns: true,
        print: false,
        setTableProps: () => {
            return {
                // material ui v4 only
                size: 'small',
            };
        }
    };

    return (
        <>
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{flexGrow: 1}}>
                        <Link href="/" id={"logo"}>BPROF</Link>
                    </Typography>
                </Toolbar>
            </AppBar>

            <Container maxWidth={false}>

                <Box sx={{mb: 3, mt: 3}}>
                    <Grid container spacing={3}>

                        <Grid item xs={12}>
                            <Paper
                                sx={{
                                    p: 2,
                                    display: "flex",
                                    flexDirection: "column",
                                }}
                            >
                                <Typography component="h5" variant="h5">
                                    Analysis of call <Link href={"/trace/?id=" + props.trace.uuid}>
                                    {props.trace.uuid}
                                </Link>
                                </Typography>
                                <Box sx={{m: 0, p: 0}} className="monospace">
                                    <strong>URI:</strong> {props.trace.method + " " + props.trace.url}<br/>
                                    <strong>Server:</strong> {props.trace.server_name}<br/>
                                    <strong>Caller IP:</strong> {props.trace.ip}<br/>
                                    <strong>Request
                                        Time:</strong> {new Date(props.trace.created_at * 1000).toISOString()}<br/>
                                    <strong>User ID:</strong> {props.trace.user_id}
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>
                </Box>

                <Box sx={{mb: 3, mt: 3}}>
                    <Grid container spacing={3}>

                        <Grid item xs={12} sm={6} md={3} lg={3}>
                            <Paper
                                sx={{
                                    p: 2,
                                    display: "flex",
                                    flexDirection: "column",
                                }}
                            >
                                <Typography component="p" variant="body2">
                                    Total Duration
                                </Typography>
                                <Typography component="p" variant="h4">
                                    {Math.trunc(props.totals.wt / 1000).toLocaleString()}ms
                                </Typography>
                            </Paper>
                        </Grid>


                        <Grid item xs={12} sm={6} md={3} lg={3}>
                            <Paper
                                sx={{
                                    p: 2,
                                    display: "flex",
                                    flexDirection: "column",
                                }}
                            >
                                <Typography component="p" variant="body2">
                                    Symbol Count
                                </Typography>
                                <Typography component="p" variant="h4">
                                    {Object.keys(props.symbols).length.toLocaleString()}
                                </Typography>
                            </Paper>
                        </Grid>

                        <Grid item xs={12} sm={6} md={3} lg={3}>
                            <Paper
                                sx={{
                                    p: 2,
                                    display: "flex",
                                    flexDirection: "column",
                                }}
                            >
                                <Typography component="p" variant="body2">
                                    Peak memory usage
                                </Typography>
                                <Typography component="p" variant="h4">
                                    {(props.totals.pmu / 1024 / 1024).toLocaleString()}mb
                                </Typography>
                            </Paper>
                        </Grid>


                        <Grid item xs={12} sm={6} md={3} lg={3}>
                            <Paper
                                sx={{
                                    p: 2,
                                    display: "flex",
                                    flexDirection: "column",
                                }}
                            >
                                <Typography component="p" variant="body2">
                                    MySQL Queries
                                </Typography>
                                <Typography component="p" variant="h4">
                                    {mysqlQueries.toLocaleString()}
                                </Typography>
                            </Paper>
                        </Grid>

                    </Grid>
                </Box>

                <Box sx={{mb: 3, mt: 3}}>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Paper>
                                <TableContainer>
                                    <MUIDataTable
                                        title={"Symbols"}
                                        data={tableRows}
                                        columns={tableColumns}
                                        options={tableOptions}
                                    />
                                </TableContainer>
                            </Paper>
                        </Grid>
                    </Grid>
                </Box>

                <Box sx={{mb: 3, mt: 3}}>
                    <Grid container spacing={3}>
                        <Grid item xs={6}>
                            <Paper sx={{p: 2}}>
                                <Typography component="h6" variant="h6">
                                    <strong>$_POST</strong>
                                </Typography>
                                <pre>{JSON.stringify(props.trace.post, null, 4)}</pre>

                                <Typography component="h6" variant="h6">
                                    <strong>$_GET</strong>
                                </Typography>
                                <pre>{JSON.stringify(props.trace.get, null, 4)}</pre>
                            </Paper>
                        </Grid>
                        <Grid item xs={6}>
                            <Paper sx={{p: 2}}>
                                <Typography component="h6" variant="h6">
                                    <strong>Headers</strong>
                                </Typography>
                                <pre>{JSON.stringify(props.trace.headers, null, 4)}</pre>

                                <Typography component="h6" variant="h6">
                                    <strong>Cookies</strong>
                                </Typography>
                                <pre>{JSON.stringify(props.trace.cookie, null, 4)}</pre>
                            </Paper>
                        </Grid>
                    </Grid>
                </Box>

            </Container>
        </>
    )
}
