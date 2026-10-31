---
layout: inner
title: "Projects"
eyebrow: "Open source & research software"
description: "Open-source tools and reproducible research software for molecular AI, structural bioinformatics, cheminformatics and multi-omics."
permalink: /projects/
header:
  image: profile.jpg
---

{% include base_path %}
{% assign p = site.data.profile %}

<div class="chapter-prose">
  <p>{{ p.intro }}</p>
</div>

{% include chapter/projects.html %}
