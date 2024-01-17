import * as React from 'react';
import TableContainer from '@mui/material/TableContainer';
import InfoIcon from '@mui/icons-material/Info';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Link from "@mui/material/Link";
import {Trace} from "../Services/Bprof";
import {TraceRepositoryClient} from "../Repository/TraceRepositoryClient";
import {useEffect, useState} from "react";
import MUIDataTable, {MUIDataTableColumn, MUIDataTableColumnOptions, MUIDataTableOptions} from "mui-datatables";
import {useParams} from "react-router-dom";
import Tooltip from '@mui/material/Tooltip';
import {IconButton, Skeleton} from "@mui/material";
import {sortNumeric, toFixedDown} from "../Services/Utils";

interface IState {
    id: string;
    tableRows: (object | string[] | number[])[] | any,
    trace: Trace | null,
    totals: {
        ct: number;
        wt: number;
        ut: number;
        st: number;
        cpu: number;
        mu: number;
        pmu: number;
        samples: number;
    } | null,
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
    } | null,
    mysqlQueries: number;
    search: string;
}

export default function SingleTrace() {

    const { traceId } = useParams();

    const [state, updateState] = useState<IState>({
        id: traceId as string,
        tableRows: [],
        trace: null,
        totals: null,
        symbols: null,
        mysqlQueries: 0,
        search: ""
    });

    useEffect(() => {
        TraceRepositoryClient.getTrace(state.id).then((response) => {
            console.log(response.totals);

            const mysqlQueries = Object.keys(response.symbols).filter((key) => key.includes("PDOStatement::execute") || key.includes("PDO::exec")).map((key) => {
                return response.symbols[key].ct;
            }).reduce((a, b) => a + b, 0);

            const tableRows = Object.entries(response.symbols).map(([key, value]) => {
                let [symbol, meta] = key.split("#");
                let [clazz, method] = symbol.split("::");

                if (state.search && !key.toLowerCase().includes(state.search.toLowerCase())) {
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
                    toFixedDown(value.excl_wt / response.totals.wt * 100, 2) + "%",
                ];
            }).filter((row) => row !== null);

            updateState((prevState) => ({
                ...prevState,
                tableRows: tableRows,
                trace: response.trace,
                totals: response.totals,
                symbols: response.symbols,
                mysqlQueries: mysqlQueries
            }));
        })
    }, [state.id, state.search])

    const tableColumns: MUIDataTableColumn[] = [
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
                customBodyRender: (value: any, tableMeta: any, updateValue: any) => {
                    let [symbol, meta] = value.split("#");
                    let [clazz, method] = symbol.split("::");

                    return <>
                        <Link
                            href={`/trace/${state.id}/${btoa(value)}`}>
                            {method ? (<>{clazz}::<strong>{method}</strong></>) : (<strong>{clazz}</strong>)}
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


    const tableOptions: MUIDataTableOptions = {
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
            {(!state.trace || !state.symbols || !state.totals) ? (
                <Box sx={{mb: 3, mt: 3}}>

                    <Box sx={{mb: 3, mt: 3}}>
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <Skeleton animation="wave" variant="rectangular" height={200} />
                            </Grid>
                        </Grid>
                    </Box>

                    <Box sx={{mb: 3, mt: 3}}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6} md={3} lg={3}>
                                <Skeleton animation="wave" variant="rectangular" height={100} />
                            </Grid>

                            <Grid item xs={12} sm={6} md={3} lg={3}>
                                <Skeleton animation="wave" variant="rectangular" height={100} />
                            </Grid>

                            <Grid item xs={12} sm={6} md={3} lg={3}>
                                <Skeleton animation="wave" variant="rectangular" height={100} />
                            </Grid>

                            <Grid item xs={12} sm={6} md={3} lg={3}>
                                <Skeleton animation="wave" variant="rectangular" height={100} />
                            </Grid>
                        </Grid>
                    </Box>

                    <Box sx={{mb: 3, mt: 3}}>
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <Skeleton animation="wave" variant="rectangular" height={600} />
                            </Grid>
                        </Grid>
                    </Box>

                </Box>
            ) : (<></>)}

            {state.trace && state.symbols && state.totals && (
                <>
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
                                        Analysis of call <Link href={"/trace/" + state.trace.uuid}>
                                        {state.trace.uuid}
                                    </Link>
                                    </Typography>
                                    <Box sx={{m: 0, p: 0}} className="monospace">
                                        <strong>URI:</strong> {state.trace.method + " " + state.trace.url}<br/>
                                        <strong>Server:</strong> {state.trace.server_name}<br/>
                                        <strong>Caller IP:</strong> {state.trace.ip}<br/>
                                        <strong>Request
                                            Time:</strong> {new Date(state.trace.created_at * 1000).toISOString()}<br/>
                                        <strong>User ID:</strong> {state.trace.user_id}
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
                                        {Math.trunc(state.totals.wt / 1000).toLocaleString()}ms
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
                                        {Object.keys(state.symbols).length.toLocaleString()}
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
                                        {(state.totals.pmu / 1024 / 1024).toLocaleString()}mb
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
                                        {state.mysqlQueries.toLocaleString()}
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
                                            data={state.tableRows}
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
                                    <pre>{JSON.stringify(state.trace.post, null, 4)}</pre>

                                    <Typography component="h6" variant="h6">
                                        <strong>$_GET</strong>
                                    </Typography>
                                    <pre>{JSON.stringify(state.trace.get, null, 4)}</pre>
                                </Paper>
                            </Grid>
                            <Grid item xs={6}>
                                <Paper sx={{p: 2}}>
                                    <Typography component="h6" variant="h6">
                                        <strong>Headers</strong>
                                    </Typography>
                                    <pre>{JSON.stringify(state.trace.headers, null, 4)}</pre>

                                    <Typography component="h6" variant="h6">
                                        <strong>Cookies</strong>
                                    </Typography>
                                    <pre>{JSON.stringify(state.trace.cookie, null, 4)}</pre>
                                </Paper>
                            </Grid>
                        </Grid>
                    </Box>
                </>
            )}
        </>
    );
}
