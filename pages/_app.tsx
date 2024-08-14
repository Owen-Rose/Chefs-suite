import "../styles/globals.css";
import type { AppProps } from "next/app";
import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "../context/AuthContext";
import { RecipeProvider } from "../context/RecipeContext";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Create a theme instance.
const theme = createTheme({
  // You can customize your theme here
  // For example:
  // palette: {
  //   primary: {
  //     main: '#556cd6',
  //   },
  //   secondary: {
  //     main: '#19857b',
  //   },
  // },
});

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <SessionProvider session={pageProps.session}>
      <AuthProvider>
        <RecipeProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <Component {...pageProps} />
          </ThemeProvider>
        </RecipeProvider>
      </AuthProvider>
    </SessionProvider>
  );
}

export default MyApp;