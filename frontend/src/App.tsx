import * as React from 'react';
import ListTraces from './Pages/ListTraces';
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import Container from "@mui/material/Container";
import Copyright from "./Components/Copyright";
import {memo, ReactNode} from 'react';

interface AppProps {
    children?: ReactNode;
}

export default memo(function App(props: AppProps) {
    return (
        <>
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{flexGrow: 1}}>
                        <Link href="/" id={"logo"} sx={{color: "white"}}>BPROF</Link>
                    </Typography>
                </Toolbar>
            </AppBar>
            <Container maxWidth={false}>
                {props.children}
            </Container>
            <Copyright/>
        </>
    );
});