---
permalink: /
title: "Abdelmoujoud Faris — Computational Chemist & Bioinformatician"
layout: landing
---

{% include base_path %}

<section class="section" id="research">
  <div class="container">
    <div class="section__head">
      <div>
        <p class="section__eyebrow">Research</p>
        <h2 class="section__title">Research areas</h2>
      </div>
      <a class="section__head-link" href="{{ '/research/' | relative_url }}">
        View all research
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
      </a>
    </div>
    {% include chapter/research.html %}
  </div>
</section>

<section class="section section--alt" id="projects">
  <div class="container">
    <div class="section__head">
      <div>
        <p class="section__eyebrow">Projects</p>
        <h2 class="section__title">Selected projects</h2>
      </div>
      <a class="section__head-link" href="{{ '/projects/' | relative_url }}">
        View all projects
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
      </a>
    </div>
    {% include chapter/projects.html %}
  </div>
</section>

<section class="section" id="publications">
  <div class="container">
    <div class="section__head">
      <div>
        <p class="section__eyebrow">Publications</p>
        <h2 class="section__title">Selected publications</h2>
      </div>
      <a class="section__head-link" href="{{ '/publications/' | relative_url }}">
        View all publications
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
      </a>
    </div>
    {% include chapter/publications.html compact=true %}
  </div>
</section>

<section class="section section--alt" id="experience">
  <div class="container">
    <div class="section__head">
      <div>
        <p class="section__eyebrow">Experience</p>
        <h2 class="section__title">Professional experience</h2>
      </div>
      <a class="section__head-link" href="{{ '/experience/' | relative_url }}">
        View all experience
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
      </a>
    </div>
    {% include chapter/experience.html %}
  </div>
</section>

<section class="section" id="skills">
  <div class="container">
    <div class="section__head">
      <div>
        <p class="section__eyebrow">Skills</p>
        <h2 class="section__title">Skills &amp; methods</h2>
      </div>
      <a class="section__head-link" href="{{ '/skills/' | relative_url }}">
        View all skills
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
      </a>
    </div>
    {% include chapter/skills.html %}
  </div>
</section>

<section class="section section--contact" id="contact">
  <div class="container">
    <p class="section__eyebrow">Contact</p>
    <h2 class="section__title">Get in touch</h2>
    {% include chapter/contact.html %}
  </div>
</section>
