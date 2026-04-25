import localFont from "next/font/local"

import "./globals.css"
import { AnalyticsProvider } from "@/components/analytics-provider"
import { cn } from "@/lib/utils"

const jetbrainsMonoHeading = localFont({
  src: "./fonts/JetBrainsMono-Variable.ttf",
  variable: "--font-app-heading",
  weight: "100 800",
  display: "swap",
})

const spaceGrotesk = localFont({
  src: "./fonts/SpaceGrotesk-Variable.ttf",
  variable: "--font-app-sans",
  weight: "300 700",
  display: "swap",
})

const fontMono = localFont({
  src: "./fonts/GeistMono-Latin.woff2",
  variable: "--font-app-mono",
  weight: "100 900",
  display: "swap",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "font-sans antialiased",
        fontMono.variable,
        spaceGrotesk.variable,
        jetbrainsMonoHeading.variable
      )}
    >
      <body className="min-h-svh bg-background text-foreground">
        <AnalyticsProvider>{children}</AnalyticsProvider>
      </body>
    </html>
  )
}
