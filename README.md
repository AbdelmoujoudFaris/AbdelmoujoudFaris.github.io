# Abdelmoujoud Faris — academic website

Personal research site of Abdelmoujoud Faris, PhD: computational chemistry,
cheminformatics, structural bioinformatics and machine learning for drug
discovery.

Live site: <https://abdelmoujoudfaris.github.io/>

## Stack

- Jekyll (GitHub Pages compatible), based on Academic Pages
- Single-page home (`_layouts/landing.html`) with sticky section navigation,
  scroll-spy, a light-first theme with a persisted dark toggle, and client-side
  publication search/filter/sort
- Shared inner layout (`_layouts/inner.html`) for the CV and per-publication
  pages so every page shares one header, footer and type scale
- Publication records generated from ORCID and verified against Crossref and
  Unpaywall

## Content

| Path | Purpose |
| --- | --- |
| `_data/profile.yml` | Home-page content: nav targets, hero, research areas, experience, education, projects, skills |
| `_config.yml` | Site identity, author profile, social links, build settings |
| `_data/publications.yml` | Verified publication records (generated) |
| `_publications/*.md` | One Jekyll document per publication (generated) |
| `assets/data/publications.json` | Machine-readable publication records (generated) |
| `files/publications/` | Locally hosted PDFs (only redistributable licences) |
| `_pages/about.md` | Home page: hero plus the `#research` … `#contact` sections |
| `_includes/chapter/*.html` | Section partials shared by the home page |
| `_pages/cv.md` | Curriculum vitae |
| `assets/css/landing.css`, `assets/js/landing.js` | Site styles and behaviour |

## Navigation

The primary nav links to in-page anchors on the home page (`#about`,
`#research`, `#projects`, `#publications`, `#experience`, `#skills`,
`#contact`). From any other page they resolve to `/<page>#<section>` so the
header stays consistent. Section offsets are handled with `scroll-margin-top`;
the active link is tracked by a scroll listener with an "at page bottom" rule,
and the mobile drawer closes on link selection.

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
