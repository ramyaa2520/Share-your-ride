import { createTheme } from '@mui/material/styles';

// Create a custom theme for the app
const theme = createTheme({
  palette: {
    primary: {
      main: '#2E3B55',
      light: '#546791',
      dark: '#1A2238',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#FF6B6B',
      light: '#FF9C9C',
      dark: '#C83E3E',
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#4CAF50',
      light: '#80E27E',
      dark: '#087F23',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#F44336',
      light: '#FF7961',
      dark: '#BA000D',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F5F5F5',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#333333',
      secondary: '#666666',
      disabled: '#999999',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 30,
          padding: '8px 24px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0px 6px 15px rgba(0, 0, 0, 0.15)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0px 3px 15px rgba(0, 0, 0, 0.05)',
          borderRadius: 12,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
  },
});

export default theme; 