<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into totoneru. Changes span five files: the PostHog init config was upgraded with a reverse proxy, exception capture, and consent-first event tracking; two CTA buttons were extracted into a new client component with click tracking; the theme toggle gained a `theme_changed` capture; and `next.config.mjs` received the required `/ingest` proxy rewrites. Environment variables are set in `.env.local`.

| Event | Description | File |
|---|---|---|
| `import_deck_clicked` | User clicks the primary "Import deck" CTA — top of the conversion funnel | `components/home-ctas.tsx` |
| `architecture_viewed` | User clicks the "View architecture" secondary CTA | `components/home-ctas.tsx` |
| `analytics_consent_accepted` | User accepts the analytics consent banner (fires once, on first acceptance) | `components/analytics-provider.tsx` |
| `theme_changed` | User switches between light and dark mode (includes `theme` property) | `components/theme-toggle.tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard — Analytics basics**: https://us.posthog.com/project/395574/dashboard/1505971
- **Import deck CTA — daily clicks**: https://us.posthog.com/project/395574/insights/uxQGJVKc
- **Consent → import funnel**: https://us.posthog.com/project/395574/insights/Vmefd78g
- **CTA comparison — import vs architecture**: https://us.posthog.com/project/395574/insights/tQ8cfwpz
- **Theme preference breakdown**: https://us.posthog.com/project/395574/insights/eYHdAiWa
- **Analytics consent accepted — total users**: https://us.posthog.com/project/395574/insights/9GNDtyfT

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
