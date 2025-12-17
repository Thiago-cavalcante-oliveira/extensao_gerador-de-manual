import { createTheme, type MantineColorsTuple } from '@mantine/core';

const fozBlue: MantineColorsTuple = [
    '#e7f5ff',
    '#d0ebff',
    '#a5d8ff',
    '#74c0fc',
    '#4dabf7',
    '#339af0',
    '#228be6',
    '#1c7ed6',
    '#1971c2',
    '#1864ab',
];

const fozGreen: MantineColorsTuple = [
    '#ebfbee',
    '#d3f9d8',
    '#b2f2bb',
    '#8ce99a',
    '#69db7c',
    '#51cf66',
    '#40c057',
    '#37b24d',
    '#2f9e44',
    '#2b8a3e',
];

export const theme = createTheme({
    primaryColor: 'fozBlue',
    colors: {
        fozBlue,
        fozGreen,
    },
    fontFamily: 'Inter, sans-serif',
    headings: {
        fontFamily: 'Inter, sans-serif',
    },
});
