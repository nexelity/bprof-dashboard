import './../../app/globals.css'
import * as React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Link from 'next/link'
import phpUnserialize from 'phpunserialize';
import zlib from 'zlib';
import {BprofData, BprofLib, Symbol, Trace} from "@/services/BprofLib";
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import {getTraceById} from "@/services/TraceRepository";
import parse from "html-react-parser";

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

    let symbol = context.query["symbol"] ?? "";
    if (symbol) symbol = atob(symbol);

    let trace = await getTraceById(id)
    let decompressed = await decompressData(trace.perfdata as string);

    // @ts-ignore
    trace.perfdata = phpUnserialize(decompressed) as BprofData

    let bprof: BprofLib = new BprofLib();
    bprof.initMetrics(trace.perfdata)

    let flat = bprof.computeFlatInfo(trace.perfdata)
    return {
        props: {
            trace,
            totals: flat.totals,
            symbols: flat.symbols,
            children: bprof.getChildrenTable(trace.perfdata),
            parents: bprof.getParentTable(trace.perfdata),
            search,
            symbol
        }
    }
}

export default function Home(props: {
    trace: Trace,
    totals: Symbol,
    symbols: { [key: string]: Symbol },
    search: string,
    children: { [key: string]: string[] },
    parents: { [key: string]: string[] },
    symbol: string
}) {


    let [symbolName, symbolMeta] = props.symbol.split("#");
    let [clazzName, methodName] = symbolName.split("::");


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
                                    {props.trace.method + " " + props.trace.url}
                                </Box>
                            </Paper>
                        </Grid>
                        <Grid item xs={6}>
                            <Paper
                                sx={{
                                    p: 2,
                                    display: "flex",
                                    flexDirection: "column",
                                }}
                            >
                                <Box sx={{m: 0, p: 0}}>
                                    <Typography variant="body1">
                                        <strong>Caller IP:</strong> {props.trace.ip}<br />
                                        <strong>Request Time:</strong> {new Date(props.trace.created_at*1000).toISOString()}<br />
                                        <strong>User ID:</strong> {props.trace.user_id}
                                    </Typography>
                                </Box>
                            </Paper>
                        </Grid>

                    </Grid>
                </Box>

                <Typography component="h6" variant="h6">
                    {clazzName}::<strong>{methodName}</strong>
                </Typography>
                {symbolMeta ? parse('<textarea style="min-height: 100px">' + symbolMeta + '</textarea>') : ""}

                <Box sx={{mb: 3, mt: 3}}>
                    <Grid container spacing={3}>
                        <Grid item xs={6}>
                            <TableContainer component={Paper}>
                                <Table size="small" aria-label="simple table">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell><strong>Parent callers</strong></TableCell>
                                            <TableCell><strong>Call count</strong></TableCell>
                                            <TableCell><strong>Wall Time</strong></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {props.parents[props.symbol] ? props.parents[props.symbol].map((key) => {
                                            let [symbol, meta] = key.split("#");
                                            let [clazz, method] = symbol.split("::");
                                            let fullPath = key + ">>>" + props.symbol;
                                            let stats = props.trace.perfdata[fullPath];
                                            return (
                                                <TableRow key={key}>
                                                    <TableCell sx={{maxWidth: "300px", fontFamily: "monospace"}}>
                                                        <Link
                                                            href={"/trace-symbol/?id=" + props.trace.uuid + "&symbol=" + Buffer.from(key).toString('base64')}>
                                                            {method ? parse(clazz + "::<strong>" + method + "</strong>") : parse("<strong>" + clazz + "</strong>")}
                                                        </Link>
                                                        {meta ? parse('<textarea>' + meta + '</textarea>') : ""}
                                                    </TableCell>
                                                    <TableCell>
                                                        {stats.ct}
                                                    </TableCell>
                                                    <TableCell>
                                                        {Math.floor(stats.wt/1000).toLocaleString()}ms
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        }) : (
                                            <TableRow key={"none"}>
                                                <TableCell>
                                                    No parent methods
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Grid>

                        <Grid item xs={6}>
                            <TableContainer component={Paper}>
                                <Table size="small" aria-label="simple table">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell><strong>Child methods</strong></TableCell>
                                            <TableCell align={"right"}><strong>Call count</strong></TableCell>
                                            <TableCell align={"right"}><strong>Wall Time</strong></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {props.children[props.symbol] ? props.children[props.symbol].map((key) => {
                                            let [symbol, meta] = key.split("#");
                                            let [clazz, method] = symbol.split("::");
                                            let fullPath = props.symbol + ">>>" + key;
                                            let stats = props.trace.perfdata[fullPath];
                                            return (
                                                <TableRow key={key}>
                                                    <TableCell sx={{maxWidth: "300px", fontFamily: "monospace"}}>
                                                        <Link
                                                            href={"/trace-symbol/?id=" + props.trace.uuid + "&symbol=" + Buffer.from(key).toString('base64')}>
                                                            {method ? parse(clazz + "::<strong>" + method + "</strong>") : parse("<strong>" + clazz + "</strong>")}
                                                        </Link>
                                                        {meta ? parse('<textarea>' + meta + '</textarea>') : ""}
                                                    </TableCell>
                                                    <TableCell align={"right"}>{stats.ct}</TableCell>
                                                    <TableCell align={"right"}>{Math.floor(stats.wt/1000).toLocaleString()}ms</TableCell>
                                                </TableRow>
                                            )
                                        }) : (
                                            <TableRow key={"none"}>
                                                <TableCell>
                                                    No child methods
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Grid>

                    </Grid>

                </Box>
            </Container>
        </>
    )
}
