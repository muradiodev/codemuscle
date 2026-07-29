import "./globals.css";
import { JetBrains_Mono } from "next/font/google";
import { Providers } from "./providers";
import { AppChrome } from "../components/AppChrome";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap"
});

export const metadata = {
  title: "CodeMuscle",
  description: "Deliberate manual coding practice for experienced engineers"
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning data-theme="dark" className={jetbrainsMono.variable}>
      <body>
        <Providers>
          <AppChrome>{children}</AppChrome>
        </Providers>
      </body>
    </html>
  );
}
