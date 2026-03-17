import { alpha, createTheme } from '@mui/material/styles';

export const appTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1F3A8A' },
    secondary: { main: '#0F766E' },
    background: {
      default: '#F7F9FC',
      paper: '#FFFFFF'
    }
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
    h4: { fontWeight: 700, letterSpacing: -0.3 },
    h6: { fontWeight: 650, letterSpacing: -0.2 },
    subtitle1: { color: 'rgba(0,0,0,0.70)' },
    body2: { color: 'rgba(0,0,0,0.75)' }
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage: `radial-gradient(${alpha('#1F3A8A', 0.10)} 0px, transparent 40%)`,
          backgroundSize: '1200px 1200px',
          backgroundPosition: '0 -300px'
        }
      }
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          border: `1px solid ${alpha('#0B1220', 0.10)}`,
          backgroundImage: 'none'
        }
      }
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 12,
          fontWeight: 650
        }
      }
    },
    MuiTextField: {
      defaultProps: { size: 'small' }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 650
        }
      }
    },
    MuiLink: {
      defaultProps: { underline: 'hover' }
    }
  }
});

