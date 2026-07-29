import "./globals.css";
import Link from "next/link";
import { JetBrains_Mono } from "next/font/google";
import { Providers } from "./providers";

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
          <nav className="app-nav">
            <Link className="brand" href="/">
              CodeMuscle
            </Link>
            <div className="nav-links">
              <Link href="/">Today</Link>
              <Link href="/projects">Projects</Link>
              <Link href="/statistics">Statistics</Link>
              <Link href="/sessions">Sessions</Link>
              <Link href="/settings">Settings</Link>
            </div>
          </nav>
          {children}
        </Providers>
      </body>
    </html>
  );
}
