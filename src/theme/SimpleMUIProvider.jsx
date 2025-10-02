'use client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';

// Theme simple pour éviter les problèmes d'hydratation
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
  },
  cssVariables: true, // Important pour éviter les conflits d'hydratation
});

export default function SimpleMUIProvider({ children }) {
  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}