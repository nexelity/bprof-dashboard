import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import CssBaseline from '@mui/material/CssBaseline';
import {ThemeProvider} from '@mui/material/styles';
import App from './App';
import theme from './theme';
import './global.css';
import {createBrowserRouter, RouterProvider} from "react-router-dom";
import ListTraces from "./Pages/ListTraces";
import SingleTrace from "./Pages/SingleTrace";
import TraceSymbol from "./Pages/TraceSymbol";

const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement!);

const router = createBrowserRouter([
    { path: "/", element: (<App><ListTraces/></App>) },
    { path: "/trace/:traceId", element: (<App><SingleTrace/></App>) },
    { path: "/trace/:traceId/:symbolId", element: (<App><TraceSymbol/></App>) },
]);

root.render(
    <ThemeProvider theme={theme}>
        <CssBaseline/>
        <RouterProvider router={router}/>
    </ThemeProvider>,
);
