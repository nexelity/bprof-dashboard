import * as React from 'react';
import {useEffect, useState} from 'react';
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
import {BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Title, Tooltip,} from 'chart.js';
import {Bar} from 'react-chartjs-2';
import TextField from "@mui/material/TextField";
import Link from "@mui/material/Link";
import {Trace} from "../Services/Bprof";
import {TraceRepositoryClient} from "../Repository/TraceRepositoryClient";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface StatsRow {
    day: string,
    total_rows: number,
    min_wt: number,
    avg_wt: number,
    max_wt: number
}

interface IProps {
    count: number;
    count24h: number;
    avg24h: number;
    max24h: number;
    search: string;
    date_from: string;
    date_to: string;
    page: number;
    rowCount: number;
    minDuration: number;
    stats_by_day: StatsRow[];
    data: Trace[];
    chartData: {
        labels: string[],
        datasets: Array<{
            label: string,
            data: number[],
            backgroundColor: string,
        }>
    }
}

export default function ListTraces() {

    function onMinDurationChange(event: React.ChangeEvent<HTMLInputElement>) {
        updateState((prevState) => ({
            ...prevState,
            minDuration: parseInt(event.target.value)
        }));
    }
    function onSearchChange(event: React.ChangeEvent<HTMLInputElement>) {
        updateState((prevState) => ({
            ...prevState,
            search: event.target.value
        }));
    }

    function onDateFromChange(event: React.ChangeEvent<HTMLInputElement>) {
        updateState((prevState) => ({
            ...prevState,
            date_from: event.target.value
        }));
    }

    function onDateToChange(event: React.ChangeEvent<HTMLInputElement>) {
        updateState((prevState) => ({
            ...prevState,
            date_to: event.target.value
        }));
    }

    function newerTraces() {
        updateState((prevState) => ({
            ...prevState,
            page: Math.max(1, prevState.page - 1)
        }));
    }

    function olderTraces() {
        updateState((prevState) => ({
            ...prevState,
            page:Math.max(1, prevState.page + 1)
        }));
    }

    const [state, updateState] = useState<IProps>({
        count: 0,
        count24h: 0,
        avg24h: 0,
        max24h: 0,
        search: "",
        date_from: "",
        date_to: "",
        page: 1,
        rowCount: 50,
        minDuration: 0,
        stats_by_day: [] as StatsRow[],
        data: [] as Trace[],
        chartData: {
            labels: [],
            datasets: [
                {
                    label: 'Average Wall Time',
                    data: [],
                    backgroundColor: 'rgba(167, 0, 167, 1)',
                },
            ],
        }
    });

    function updatePageState() {
        TraceRepositoryClient.getTraces(
            state.search,
            state.date_from,
            state.date_to,
            state.page,
            state.rowCount,
            state.minDuration
        ).then((response) => {
            updateState((prevState) => ({
                ...prevState,
                data: response
            }));
        })

        TraceRepositoryClient.getStats().then((response) => {

            const labels = response.stats_by_day.map((row: StatsRow) => row.day);
            const chartData = {
                labels: labels,
                animate: false,
                datasets: [
                    {
                        label: 'Average Wall Time',
                        data: response.stats_by_day.map((row: StatsRow) => row.avg_wt / 1000),
                        backgroundColor: 'rgba(167, 0, 167, 1)',
                    },
                ],
            };

            updateState((prevState) => ({
                ...prevState,
                count: response.total.count,
                count24h: response.last_24h.count,
                avg24h: response.stats.avg,
                max24h: response.stats.max,
                stats_by_day: response.stats_by_day,
                chartData: chartData,
            }));

            console.log(chartData);
        });
    }

    const MINUTE_MS = 60000;
    // Update the state every minute automatically
    useEffect(() => {
        const interval = setInterval(() => updatePageState(), MINUTE_MS);
        return () => clearInterval(interval);
    }, [])

    useEffect(() => {
        updatePageState();
    }, [state.page, state.search, state.date_from, state.date_to, state.rowCount, state.minDuration])

    return (
        <>
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
                                Number of Traces (all)
                            </Typography>
                            <Typography component="p" variant="h4">
                                {state.count ? state.count.toLocaleString() : "-"}
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
                                {state.count24h ? state.count24h.toLocaleString() : "-"}
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
                                {state.avg24h ? Math.floor(state.avg24h / 1000).toLocaleString() + "ms" : "-"}
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
                                {state.max24h ? Math.floor(state.max24h / 1000).toLocaleString() + "ms" : "-"}
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
                            <Bar
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: {
                                            position: 'top' as const,
                                        },
                                    },
                                }}
                                data={state.chartData}
                            />
                        </Paper>
                    </Grid>

                </Grid>
            </Box>

            <Box sx={{mb: 3, mt: 3}}>
                <Paper sx={{p: 2}}>
                    <Typography variant="h6" component="div">
                        Search traces
                    </Typography>
                    <TextField
                        size={"small"}
                        name={"search"}
                        defaultValue={state.search}
                        InputLabelProps={{shrink: true}}
                        sx={{mr: 3, borderRadius: "4px"}}
                        variant="outlined"
                        placeholder="URI, IP, User, etc…"
                        inputProps={{'aria-label': 'search'}}
                        onChange={onSearchChange}
                    />
                    <TextField
                        size={"small"}
                        name={"date_from"}
                        defaultValue={state.date_from}
                        InputLabelProps={{shrink: true}}
                        label={"Date From"}
                        sx={{mr: 3, borderRadius: "4px"}}
                        variant="outlined"
                        placeholder="URI, IP, User, etc…"
                        type={"datetime-local"}
                        inputProps={{'aria-label': 'search'}}
                        onChange={onDateFromChange}
                    />
                    <TextField
                        size={"small"}
                        name={"date_to"}
                        defaultValue={state.date_to}
                        InputLabelProps={{shrink: true}}
                        label={"Date To"}
                        sx={{mr: 3, borderRadius: "4px"}}
                        variant="outlined"
                        placeholder="URI, IP, User, etc…"
                        type={"datetime-local"}
                        inputProps={{'aria-label': 'search'}}
                        onChange={onDateToChange}
                    />
                    <TextField
                        size={"small"}
                        name={"min_duration"}
                        defaultValue={state.minDuration}
                        InputLabelProps={{shrink: true}}
                        label={"Minimum Duration"}
                        sx={{mr: 3, borderRadius: "4px"}}
                        variant="outlined"
                        placeholder="Minimum duration milliseconds…"
                        type={"number"}
                        inputProps={{'aria-label': 'search'}}
                        onChange={onMinDurationChange}
                    />
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
                        {state.data.map((row: Trace) => (
                            <TableRow key={row.id}>
                                <TableCell>
                                    {row.id}
                                </TableCell>
                                <TableCell sx={{
                                    textOverflow: "ellipsis",
                                    maxWidth: "300px",
                                    overflow: "hidden",
                                    whiteSpace: "nowrap"
                                }}>
                                    <Link href={"/trace/" + row.uuid}>
                                        {row.method} {row.url}
                                    </Link>
                                </TableCell>
                                <TableCell>{row.status_code}</TableCell>
                                <TableCell sx={{
                                    textOverflow: "ellipsis",
                                    maxWidth: "100px",
                                    overflow: "hidden",
                                    whiteSpace: "nowrap"
                                }}>{row.server_name}</TableCell>
                                <TableCell>{row.user_id}</TableCell>
                                <TableCell>{row.ip}</TableCell>
                                <TableCell>{Math.floor(row.wt / 1000).toLocaleString()}ms</TableCell>
                                <TableCell>{new Date(row.created_at * 1000).toISOString()}</TableCell>
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
                        <Button onClick={newerTraces} disabled={state.page <= 1}
                                startIcon={<ArrowLeftIcon/>}>Newer</Button>
                        <Button onClick={olderTraces} disabled={state.data.length <= 0}
                                endIcon={<ArrowRightIcon/>}>Older</Button>
                    </ButtonGroup>
                </Container>

                <Container sx={{textAlign: "right", mb: 2, mt: 1}} maxWidth={false}>
                    <Typography variant="body2" color="text.secondary">
                        Results {(state.rowCount) * (state.page - 1)} - {(state.rowCount) * state.page} of {state.count.toLocaleString()}
                    </Typography>
                </Container>
            </TableContainer>
        </>
    );
}
