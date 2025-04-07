import "../styles/globals.css";
import type { AppProps } from "next/app";
import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "../context/AuthContext";
import { RecipeProvider } from "../context/RecipeContext";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { Toaster } from "@/components/ui/toaster";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <SessionProvider session={pageProps.session}>
      <AuthProvider>
        <RecipeProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <Component {...pageProps} />
            <Toaster />
          </ThemeProvider>
        </RecipeProvider>
      </AuthProvider>
    </SessionProvider>
  );
}

export default MyApp;