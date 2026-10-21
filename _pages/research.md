---
layout: inner
title: "Research"
eyebrow: "Themes & methods"
description: "Research themes, scientific questions, computational approaches, molecular modelling, cheminformatics, bioinformatics and AI/ML methods."
permalink: /research/
---

{% include base_path %}
{% assign p = site.data.profile %}

<div class="chapter-prose">
  <p>{{ p.research_summary }}</p>
</div>

<h2>Research themes</h2>
{% include chapter/research.html %}

<h2>Scientific questions</h2>
<div class="chapter-prose">
  <ul>
    <li>How do protein–ligand and protein–protein interfaces encode binding affinity and selectivity, and how can that be modelled computationally?</li>
    <li>How can molecular flexibility and conformational landscapes be summarised into interpretable free-energy and structural descriptions?</li>
    <li>How do cheminformatics descriptors and learned molecular representations complement physics-based scoring?</li>
    <li>How can transcriptomic and multi-omics data be integrated to prioritise targets and contextualise compound activity?</li>
  </ul>
</div>

<h2>Computational approaches</h2>
<dl class="method-list">
  <div class="method">
    <dt>Structure-based design</dt>
    <dd>Protein structure modelling, molecular docking (GOLD, AutoDock Vina), pharmacophore modelling and structure- or ligand-based virtual screening for hit and lead identification.</dd>
  </div>
  <div class="method">
    <dt>Molecular dynamics &amp; energetics</dt>
    <dd>GROMACS / AMBER / OpenMM simulations, trajectory analysis (RMSD/RMSF), PCA free-energy landscapes, structural clustering and MM-PBSA/MM-GBSA binding free-energy estimation.</dd>
  </div>
  <div class="method">
    <dt>Cheminformatics &amp; QSAR</dt>
    <dd>RDKit descriptor and fingerprint pipelines, 2D/3D QSAR/QSPR, model validation and structure–activity interpretation, ADMET profiling.</dd>
  </div>
  <div class="method">
    <dt>Machine learning for molecules</dt>
    <dd>Graph neural networks, molecular representation learning, model interpretation with SHAP, and ML-assisted scoring and ranking.</dd>
  </div>
  <div class="method">
    <dt>Omics &amp; biological networks</dt>
    <dd>RNA-seq differential expression (DESeq2, edgeR, limma), pathway and gene-set enrichment, co-expression/network analysis and multi-omics integration.</dd>
  </div>
</dl>

<p class="chapter-next">
  See the <a href="{{ '/projects/' | relative_url }}">Projects</a> page for the software
  behind these methods, or the <a href="{{ '/publications/' | relative_url }}">Publications</a>
  archive for the resulting work.
</p>
