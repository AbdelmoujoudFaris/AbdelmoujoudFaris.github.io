# Abdelmoujoud Faris — academic website

Personal research site of Abdelmoujoud Faris, PhD: computational chemistry,
cheminformatics, structural bioinformatics and machine learning for drug
discovery.

Live site: <https://abdelmoujoudfaris.github.io/>

## Stack

- Jekyll (GitHub Pages compatible), based on Academic Pages
- Custom landing page (`_layouts/landing.html`) with a light/dark theme,
  responsive navigation and client-side publication filtering
- Publication records generated from ORCID and verified against Crossref and
  Unpaywall

## Content

| Path | Purpose |
| --- | --- |
| `_data/profile.yml` | Landing-page content: hero, research areas, experience, education, projects, skills |
| `_config.yml` | Site identity, author profile, social links, build settings |
| `_data/publications.yml` | Verified publication records (generated) |
| `_publications/*.md` | One Jekyll document per publication (generated) |
| `assets/data/publications.json` | Machine-readable publication records (generated) |
| `files/publications/` | Locally hosted PDFs (only redistributable licences) |
| `_pages/cv.md` | Curriculum vitae |
| `assets/css/landing.css`, `assets/js/landing.js` | Landing-page styles and behaviour |

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

Or with Docker (no local Ruby needed):

```bash
docker run --rm -v "$PWD:/src" -w /src ruby:3.3 \
  bash -lc "bundle install && bundle exec jekyll serve --host 0.0.0.0"
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
