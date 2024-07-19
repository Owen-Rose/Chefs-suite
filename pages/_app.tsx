import "../styles/globals.css";
import type { AppProps } from "next/app";
import { RecipeProvider } from "../context/RecipeContext";
import { AuthProvider } from '../context/AuthContext';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <RecipeProvider>
        <Component {...pageProps} />
      </RecipeProvider>
    </AuthProvider>
  );
}

export default MyApp;
