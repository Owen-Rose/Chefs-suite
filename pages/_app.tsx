import "../styles/globals.css";
import type { AppProps } from "next/app";
import { RecipeProvider } from "../context/RecipeContext";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <RecipeProvider>
      <Component {...pageProps} />
    </RecipeProvider>
  );
}

export default MyApp;
