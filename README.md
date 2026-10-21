# Abdelmoujoud Faris — academic website

Personal research site of Abdelmoujoud Faris, PhD: computational chemistry,
cheminformatics, structural bioinformatics and machine learning for drug
discovery.

Live site: <https://abdelmoujoudfaris.github.io/>

## Stack

- Jekyll (GitHub Pages compatible), based on Academic Pages
- Landing home page (`_layouts/landing.html`) with a concise hero and section
  previews that link out to dedicated pages; a persisted light/dark theme; and
  client-side publication search/filter/sort on the Publications page
- Shared inner layout (`_layouts/inner.html`) used by every dedicated page
  (About, Research, Projects, Publications, Experience, Skills, Contact), the CV
  and per-publication pages, so all pages share one header, footer and type scale
- Blue / red / white academic identity defined as CSS custom properties in
  `assets/css/landing.css`
- Publication records generated from ORCID and verified against Crossref and
  Unpaywall

## Content

| Path | Purpose |
| --- | --- |
| `_data/profile.yml` | Shared content: nav targets, hero, research areas, experience, education, projects, skills |
| `_config.yml` | Site identity, author profile, social links, build settings |
| `_data/publications.yml` | Verified publication records (generated) |
| `_publications/*.md` | One Jekyll document per publication (generated) |
| `assets/data/publications.json` | Machine-readable publication records (generated) |
| `files/publications/` | Locally hosted PDFs (only redistributable licences) |
| `_pages/index.md` | Home landing page: hero plus previews of each section |
| `_pages/chapter-about.md` | About page (`/about/`) |
| `_pages/{research,projects,experience,skills,contact}.md` | Dedicated section pages |
| `_pages/publications.html` | Publication archive with search/filter/sort |
| `_includes/chapter/*.html` | Section partials shared by the home page and dedicated pages |
| `_pages/cv.md` | Curriculum vitae |
| `assets/css/landing.css`, `assets/js/landing.js` | Site styles and behaviour |

## Navigation

Every primary nav item opens a **dedicated page** (`/about/`, `/research/`,
`/projects/`, `/publications/`, `/experience/`, `/skills/`, `/contact/`), defined
in `_data/profile.yml` and rendered by `_includes/landing/header.html`. The brand
(`Abdelmoujoud Faris`) links to the home page `/`. The current page is marked
with `aria-current="page"` and an accent underline, resolved from the URL in
`assets/js/landing.js`. The home page keeps the old `#section` ids so existing
deep links still resolve, and the mobile drawer closes on selection.

## Updating publications

`scripts/update_publications.py` fetches the ORCID record, resolves every DOI
through Crossref, checks open-access status and licences via Unpaywall, downloads
PDFs only when the licence allows redistribution, and regenerates the Jekyll
documents and JSON export.

```bash
# Full refresh: discover, verify, download open-access PDFs, rebuild, check
python scripts/update_publications.py --all

# Verify existing records without changing files
python scripts/update_publications.py --check
```

The script uses only the Python standard library. State is stored in
`scripts/publications_state.json`. Do not hand-edit the generated files.

Hosted PDFs are limited to CC0, CC BY and public-domain works. Articles under
more restrictive licences are linked at the publisher or DOI only.

## Local preview

Ruby and Bundler are required:

```bash
bundle install
bundle exec jekyll serve
```

Or with Docker (no local Ruby needed); gems are installed into the
git-ignored `vendor/bundle`, so `BUNDLE_PATH` must point there:

```bash
docker run --rm -e BUNDLE_PATH=/src/vendor/bundle -v "$PWD:/src" -w /src \
  ruby:3.3 bash -lc "bundle install && bundle exec jekyll serve --host 0.0.0.0"
```

The site is served at <http://localhost:4000>.

## Deployment

The site is published from the `main` branch with GitHub Pages. Pushing to
`main` triggers the GitHub Pages build; no separate CI configuration is
required.

## Licence and attribution

Site content and design © Abdelmoujoud Faris. The underlying Academic Pages
template is distributed under the MIT licence. Publication PDFs remain under
their original licences (see `files/publications/licences.json`).
