---
layout: inner
title: "Curriculum Vitae"
eyebrow: "Computational chemistry · Molecular AI"
permalink: /cv/
redirect_from:
  - /resume
---

{% include base_path %}

Computational chemist and research engineer working at the intersection of molecular modelling, cheminformatics, structural bioinformatics and machine learning. PhD in Physical Chemistry (Université Sidi Mohamed Ben Abdellah). Currently ML Scientist at CNRS / Université de Montpellier – BIOCAMPUS.

## Education

**PhD, Computational Chemistry — Machine Learning & Structure-Based Drug Design**  
Université Sidi Mohamed Ben Abdellah, Morocco · 2021–2025

**MSc, Computational & Structural Chemistry**  
Université Sidi Mohamed Ben Abdellah, Fès · 2019–2021

**BSc, Physical Chemistry**  
Faculté des Sciences, Université Ibn Zohr, Agadir · 2014–2018

## Research experience

{% for job in site.data.profile.experience %}
**{{ job.role }}**  
{{ job.org }} · {{ job.period }}

{% if job.points %}
{% for point in job.points %}- {{ point }}
{% endfor %}
{% endif %}
{% endfor %}

## Technical skills

{% for group in site.data.profile.skills %}
**{{ group.category }}** — {{ group.items | join: ", " }}

{% endfor %}

## Teaching

- **ATER (temporary lecturer), Université Sidi Mohamed Ben Abdellah** · 2021–2024 · 128 h/year
- Theoretical chemistry, crystallography, atomic structure and electrochemistry at undergraduate level.

## Publications

{{ site.data.publications.publications | size }} peer-reviewed journal articles with verification against Crossref and Unpaywall. Links go to the DOI record; hosted PDFs are provided only where the licence permits redistribution.

<ul class="cv-pubs">
{% assign pubs = site.data.publications.publications | sort: "year" | reverse %}
{% for pub in pubs %}
  <li>
    <strong><a href="{{ pub.publisher_url | default: pub.url }}" target="_blank" rel="noopener">{{ pub.title }}</a></strong><br />
    {{ pub.authors | join: ", " }}<br />
    <em>{{ pub.journal }}</em>, {{ pub.year }}. DOI: {{ pub.doi }}
    {% if pub.is_oa %}<span class="badge badge--oa">Open Access{% if pub.oa_license %} · {{ pub.oa_license | upcase }}{% endif %}</span>{% endif %}
    {% if pub.local_pdf and pub.local_pdf != "" %} · <a href="{{ pub.local_pdf | relative_url }}" target="_blank" rel="noopener">PDF</a>{% endif %}
  </li>
{% endfor %}
</ul>

## Languages

- **Arabic** — native
- **French** — fluent
- **English** — fluent

## References

Available on request.
