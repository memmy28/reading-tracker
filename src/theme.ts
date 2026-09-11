import { createTheme } from '@mui/material/styles'

// Central MUI theme. Customize palette, typography, and component
// defaults here rather than styling components ad hoc — this keeps
// the whole app visually consistent as it grows.
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#6d4c41', // warm brown, evokes book covers/library shelves
    },
    secondary: {
      main: '#00897b',
    },
    background: {
      default: '#faf7f2',
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 700,
    },
  },
})

export default theme
