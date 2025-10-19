'use client';
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        mode: 'light',
        primary: { main: '#1976d2' },
        secondary: { main: '#9c27b0' },
    },
    shape: { borderRadius: 12 },
    typography: {
        fontFamily: ['Pretendard', 'Inter', 'system-ui', 'Apple SD Gothic Neo', 'sans-serif'].join(','),
    },
});

export default theme;
