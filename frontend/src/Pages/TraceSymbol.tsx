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
import {IState, TableRows} from "../Interfaces/IState";



export default function TraceSymbol() {

    const { traceId, symbolId } = useParams();

    const [symbolName, setSymbolName] = useState("");
    const [tableRowsCalledBy, setTableRowsCalledBy] = useState<TableRows>([]);
    const [tableRowsCalls, setTableRowsCalls] = useState<TableRows>([]);

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

            const symbolName = atob(symbolId as string);

            setSymbolName(symbolName);

            updateState((prevState) => ({
                ...prevState,
                trace: response.trace,
                totals: response.totals,
                symbols: response.symbols,
            }));

            const tableRowsCalledBy = Object.entries(response.symbols[symbolName].callerMap).map(([key, value]) => {

                const symbol = response.symbols[key]
                return [
                    key,
                    symbol.ct.toLocaleString(),
                    symbol.callers.toLocaleString(),
                    Math.trunc(symbol.wt / 1000).toLocaleString() + "ms",
                    Math.trunc(symbol.excl_wt / 1000).toLocaleString() + "ms",
                    toFixedDown(symbol.excl_wt / response.totals.wt * 100, 2) + "%",
                ];

            }).filter((row) => row !== null);
            setTableRowsCalledBy(tableRowsCalledBy);

            const tableRowsCallRows = Object.entries(response.trace.perfdata).map(([key, value]) => {
                let [caller, destination] = key.split(/==>|>>>/);

                // We're not interested in this row
                if (caller !== symbolName) {
                    return null;
                }

                console.log(key, value);
                return [
                    key,
                    "0",
                    "0",
                    Math.trunc(value.wt / 1000).toLocaleString() + "ms",
                    "0ms",
                    "0%"
                ];
            }).filter((row) => row !== null);
            setTableRowsCalls(tableRowsCallRows);

        })
    }, [state.id, state.search])

    const tableColumns: MUIDataTableColumn[] = [
        {
            name: "symbol",
            label: "Symbol",
            options: {
                filter: false,
                sort: true,
                customBodyRender: (value: any, tableMeta: any, updateValue: any) => {
                    let [a, b] = value.split(/==>|>>>/);

                    if (a && b) {
                        return <>
                            <Link href={`/trace/${state.id}/${btoa(b)}`}>{b}</Link>
                        </>
                    } else {
                        return <>
                            <Link href={`/trace/${state.id}/${btoa(a)}`}>{a}</Link>
                        </>
                    }
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
                                    <Typography component="h5" variant="h5">
                                        Symbol: <Link href={"#"}>
                                        { symbolName }
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
                            <Grid item xs={6}>
                                <Paper>
                                    <Typography component="h5" variant="h5" sx={{p: 2}}>
                                        Is called by:
                                    </Typography>
                                    <TableContainer>
                                        <MUIDataTable
                                            title={"Symbols"}
                                            data={tableRowsCalledBy}
                                            columns={tableColumns}
                                            options={tableOptions}
                                        />
                                    </TableContainer>
                                </Paper>
                            </Grid>

                            <Grid item xs={6}>
                                <Paper>
                                    <Typography component="h5" variant="h5" sx={{p: 2}}>
                                        Makes calls to:
                                    </Typography>
                                    <TableContainer>
                                        <MUIDataTable
                                            title={"Symbols"}
                                            data={tableRowsCalls}
                                            columns={tableColumns}
                                            // options={tableOptions}
                                        />
                                    </TableContainer>
                                </Paper>
                            </Grid>
                        </Grid>
                    </Box>

                </>
            )}
        </>
    );
}
