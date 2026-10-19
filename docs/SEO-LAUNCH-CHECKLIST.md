# QueueLess technical SEO foundation

Implemented before hosting:
- Public landing page title, description, theme colour, Open Graph metadata.
- WebSite JSON-LD without inventing a production domain or physical address.
- Private student/staff/admin and authentication pages use `noindex,nofollow`.
- `robots.txt` disallows private app paths from crawling.
- Existing image alt text and lazy-loading should be checked page-by-page during final UI QA.

Deferred until a real domain and hosting exist:
- Canonical URL on the public landing page.
- Production `sitemap.xml` with absolute canonical URLs.
- Google Search Console property verification and sitemap submission.
- Real crawl/indexing checks and Core Web Vitals measurement.
- Confirm the production origin and email redirect URLs in Supabase Auth.

Do not submit placeholder URLs to Google. After hosting, replace any deployment placeholders, add the final canonical and sitemap, and verify the site in Search Console.
