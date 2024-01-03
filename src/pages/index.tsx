import './../app/globals.css'
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
import ButtonGroup from '@mui/material/ButtonGroup';
import Typography from '@mui/material/Typography';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import ArrowLeftIcon from '@mui/icons-material/ArrowLeft';
import Link from 'next/link'
import Toolbar from "@mui/material/Toolbar";
import AppBar from "@mui/material/AppBar";
import { DateField } from '@mui/x-date-pickers/DateField';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import {Trace} from "@/services/BprofLib";
import {getTracesCount, getTracesCount24h, getTracesPaginated, getTraceStats, getTraceStatsByDay} from "@/services/TraceRepository";
import TextField from "@mui/material/TextField";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

export async function getServerSideProps(context: any) {

    let pageNumber = context.query["page"] ? parseInt(context.query["page"]) : 1;
    pageNumber = pageNumber < 1 ? 1 : pageNumber;
    let search = context.query["search"] ?? null;
    if (search == "null") search = null;

    let date_from = context.query["date_from"] ?? null;
    if (date_from == "null") date_from = null;

    let date_to = context.query["date_to"] ?? null;
    if (date_to == "null") date_to = null;

    const tracesPerPage = 20;
    const tracesPaginated = await getTracesPaginated(search, date_from, date_to, pageNumber, tracesPerPage);
    const tracesCount = (await getTracesCount()).count;
    const stats = await getTraceStats();
    const statsByDay = await getTraceStatsByDay();

    return {
        props: {
            data: tracesPaginated,
            count: tracesCount,
            count24h: stats.count,
            avg24h: stats.avg,
            max24h: stats.max,
            stats: statsByDay,
            page: pageNumber,
            search,
            date_from,
            date_to,
            rowCount: tracesPerPage
        }
    }
}

interface StatsRow {
    day: string,
    total_rows: number,
    min_wt: number,
    avg_wt: number,
    max_wt: number
}

export default function Home(props: {
    count24h: number,
    stats: StatsRow[],
    data: Trace[],
    page: number,
    count: number,
    count7d: number,
    rowCount: number,
    avg7d: number,
    avg24h: number,
    max24h: number,
    search: string,
    date_from: string,
    date_to: string,
}) {

    const labels = props.stats.map((row: StatsRow) => row.day);
    const chartData = {
        labels: labels,
        datasets: [
            {
                label: 'Average Wall Time',
                data:  props.stats.map((row: StatsRow) => row.avg_wt/1000),
                backgroundColor: 'rgba(167, 0, 167, 1)',
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
            },
        },
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

                <Box sx={{ mb: 3, mt: 3 }}>

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
                                    Number of Traces (all)
                                </Typography>
                                <Typography component="p" variant="h4">
                                    {props.count.toLocaleString()}
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
                                    Number of Traces (24h)
                                </Typography>
                                <Typography component="p" variant="h4">
                                    {props.count24h.toLocaleString()}
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
                                    Average Duration (24h)
                                </Typography>
                                <Typography component="p" variant="h4">
                                    {Math.floor(props.avg24h/1000).toLocaleString()}ms
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
                                    Longest Duration (24h)
                                </Typography>
                                <Typography component="p" variant="h4">
                                    {Math.floor(props.max24h/1000).toLocaleString()}ms
                                </Typography>
                            </Paper>
                        </Grid>

                        <Grid item xs={12}>
                            <Paper
                                sx={{
                                    p: 2,
                                    display: "flex",
                                    flexDirection: "column",
                                    height: "200px"
                                }}
                            >
                                <Bar options={chartOptions} data={chartData} />
                            </Paper>
                        </Grid>

                    </Grid>
                </Box>

                <Box sx={{ mb: 3, mt: 3 }}>
                    <Paper sx={{p: 2}}>
                        <form method={"GET"} action={"/"}>
                            <Typography variant="h6" component="div">
                                Search traces
                            </Typography>
                            <TextField
                                size={"small"}
                                name={"search"}
                                defaultValue={props.search}
                                InputLabelProps={{ shrink: true }}
                                sx={{mr:3, backgroundColor: "#fff", borderRadius: "4px"}}
                                variant="outlined"
                                placeholder="URI, IP, User, etc…"
                                inputProps={{'aria-label': 'search'}}
                            />
                            <TextField
                                size={"small"}
                                name={"date_from"}
                                defaultValue={props.date_from}
                                InputLabelProps={{ shrink: true }}
                                label={"Date From"}
                                sx={{mr:3, backgroundColor: "#fff", borderRadius: "4px"}}
                                variant="outlined"
                                placeholder="URI, IP, User, etc…"
                                type={"datetime-local"}
                                inputProps={{'aria-label': 'search'}}
                            />
                            <TextField
                                size={"small"}
                                name={"date_to"}
                                defaultValue={props.date_to}
                                InputLabelProps={{ shrink: true }}
                                label={"Date To"}
                                sx={{mr:3, backgroundColor: "#fff", borderRadius: "4px"}}
                                variant="outlined"
                                placeholder="URI, IP, User, etc…"
                                type={"datetime-local"}
                                inputProps={{'aria-label': 'search'}}
                            />
                            <Button variant={"contained"}  type="submit">Submit</Button>
                        </form>
                    </Paper>
                </Box>

                <TableContainer component={Paper}>
                    <Table size="small" aria-label="simple table">
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Request</TableCell>
                                <TableCell>HTTP Status</TableCell>
                                <TableCell>Server Name</TableCell>
                                <TableCell>User</TableCell>
                                <TableCell>IP</TableCell>
                                <TableCell>Duration</TableCell>
                                <TableCell>Date</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {props.data.map((row) => (
                                <TableRow key={row.id}>
                                    <TableCell>
                                        {row.id}
                                    </TableCell>
                                    <TableCell sx={{textOverflow: "ellipsis", maxWidth: "300px", overflow: "hidden", whiteSpace: "nowrap"}}>
                                        <Link href={"/trace/?id=" + row.uuid}>
                                            {row.method} {row.url}
                                        </Link>
                                    </TableCell>
                                    <TableCell>{row.status_code}</TableCell>
                                    <TableCell sx={{textOverflow: "ellipsis", maxWidth: "100px", overflow: "hidden", whiteSpace: "nowrap"}}>{row.server_name}</TableCell>
                                    <TableCell>{row.user_id}</TableCell>
                                    <TableCell>{row.ip}</TableCell>
                                    <TableCell>{Math.floor(row.wt/1000).toLocaleString()}ms</TableCell>
                                    <TableCell>{new Date(row.created_at*1000).toISOString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    <Container sx={{textAlign: "right", mb: 1, mt: 2}} maxWidth={false}>
                        <ButtonGroup
                            disableElevation
                            variant="contained"
                            aria-label="Disabled elevation buttons"
                        >
                            <Link href={"/?search=" + props.search + "&date_from=" + props.date_from + "&date_to=" + props.date_to + "&page=" + (props.page - 1)}>
                                <Button disabled={props.page <= 1} startIcon={<ArrowLeftIcon />}>Newer</Button>
                            </Link>
                            <Link href={"/?search=" + props.search + "&date_from=" + props.date_from + "&date_to=" + props.date_to + "&page=" + (props.page + 1)}>
                                <Button disabled={props.data.length <= 0} endIcon={<ArrowRightIcon />}>Older</Button>
                            </Link>
                        </ButtonGroup>
                    </Container>

                    <Container sx={{textAlign: "right", mb: 2, mt: 1}} maxWidth={false}>
                        <Typography variant="body2" color="text.secondary">
                            Results {(props.rowCount) * (props.page-1)} - {(props.rowCount) * props.page} of {props.count.toLocaleString()}
                        </Typography>
                    </Container>

                </TableContainer>
            </Container>
        </>
    )
}
