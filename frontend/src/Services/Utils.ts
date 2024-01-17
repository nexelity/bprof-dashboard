export const toFixedDown = (number: number, dp: number) => {
    const re = new RegExp("(\\d+\\.\\d{" + dp + "})(\\d)"),
        m = number.toString().match(re);
    return m ? parseFloat(m[1]) : number.valueOf();
};

export const sortNumeric = (order: "asc" | "desc") => {
    return (a: any, b: any) => {
        let val1 = parseFloat(a.data.replace("ms", "").replace("%", "").replace(",", ""));
        let val2 = parseFloat(b.data.replace("ms", "").replace("%", "").replace(",", ""));
        return (val1 - val2) * (order === 'asc' ? 1 : -1);
    };
}