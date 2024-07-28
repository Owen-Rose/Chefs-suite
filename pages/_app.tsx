import "../styles/globals.css";
import type { AppProps } from "next/app";
import { RecipeProvider } from "../context/RecipeContext";
import { AuthProvider } from "../context/AuthContext";
import { CssBaseline } from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: { main: "#3498db" },
    secondary: { main: "#2ecc71" },
    error: { main: "#e74c3c" },
    background: { default: "#f4f4f4", paper: "#ffffff" },
    text: {
      primary: "#333333",
      secondary: "#777777",
    },
  },
  typography: {
    fontFamily: "Roboto, sans-serif",
    h1: { fontSize: "32px", fontWeight: 700 },
    h2: { fontSize: "24px", fontWeight: 700 },
    h3: { fontSize: "18px", fontWeight: 700 },
    body1: { fontSize: "14px" },
    body2: { fontSize: "12px" },
  },
});

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <RecipeProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Component {...pageProps} />
        </ThemeProvider>
      </RecipeProvider>
    </AuthProvider>
  );
}

export default MyApp;
