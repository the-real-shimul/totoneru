import { withSentryConfig } from "@sentry/nextjs"
import { fileURLToPath } from "node:url"

const emptyNodeModule = fileURLToPath(
  new URL("./lib/empty-node-module.ts", import.meta.url)
)

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config, { isServer, webpack }) {
    if (!isServer) {
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /^node:(crypto|fs)$/,
          emptyNodeModule
        )
      )
    }

    return config
  },
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/array/:path*",
        destination: "https://us-assets.i.posthog.com/array/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ]
  },
  skipTrailingSlashRedirect: true,
}

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  hideSourceMaps: true,
})
