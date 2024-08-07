import "../styles/globals.css";
import type { AppProps } from "next/app";
import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "../context/AuthContext";
import { RecipeProvider } from "../context/RecipeContext";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <SessionProvider session={pageProps.session}>
      <AuthProvider>
        <RecipeProvider>
          <Component {...pageProps} />
        </RecipeProvider>
      </AuthProvider>
    </SessionProvider>
  );
}

export default MyApp;
