import * as React from 'react';
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import Box from "@mui/material/Box";

export default function Copyright() {
    return (
        <>
            <Box sx={{textAlign: "center"}}>
                <Typography variant="subtitle1" component="div" sx={{mt: 3}}>
                    <Link href="https://github.com/nexelity/bprof-viewer/" target={"_blank"}>BPROF</Link> &copy; {new Date().getFullYear()} - v1.4 (abc238414 2023-01-01)
                </Typography>
            </Box>
        </>
    );
}
