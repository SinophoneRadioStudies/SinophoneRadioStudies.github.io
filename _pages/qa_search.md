---
layout: page
permalink: /periodicals/radio-qa/
title: Search Collections of Radio Q&A
description: Full-text search across the complete run of 無線電問答彙刊 (Shanghai, 1932–)
nav: false
---

<link rel="stylesheet" href="{{ '/assets/qa/qa.css' | relative_url }}" />

Every page of _Collections of Radio Q&A_ 無線電問答彙刊 has been transcribed, so the run can be searched by
what is actually printed in it rather than by issue number alone. <span id="qa-scale"></span>

<div class="qa-bar">
  <input id="qa-q" type="search" placeholder="Search the full run, e.g. 礦石收音機" autocomplete="off" spellcheck="false" aria-label="Search the full text" />
  <button id="qa-go" type="button">Search</button>
</div>

<p class="qa-note">
  Simplified and traditional characters are treated as the same query: 矿石 and 礦石 return identical results.
  A space between terms means <em>both</em>, <code>|</code> means <em>either</em>, and a leading <code>-</code>
  excludes. Single characters can be searched. Try
  <a class="qa-eg" href="#">真空管</a>, <a class="qa-eg" href="#">天線</a>,
  <a class="qa-eg" href="#">上海</a>, <a class="qa-eg" href="#">電池 充電</a>,
  or <a class="qa-eg" href="#">短波|超短波</a>.
</p>

<p id="qa-info"></p>
<div id="qa-results"></div>
<button id="qa-more" type="button" style="display: none"></button>

## About the periodical

_Collections of Radio Q&A_ 無線電問答彙刊 was compiled and issued in Shanghai by the China Radio Company
亞美股份有限公司, one of the largest domestic makers and retailers of radio parts. Each issue gathers the
questions readers sent in — about components, circuits, assembly, aerials, batteries, interference, and what
could actually be heard on a given set — together with the company's answers.

Because the material is reader-driven, it records something the official broadcasting record does not: what
ordinary listeners and amateur builders in 1930s China were trying to do with a radio, and where they got
stuck. The first issue opens with a subject index that divides the questions into components, receivers and
transmitters, aerials and power supplies — a rough map of what a Chinese radio hobbyist was expected to know.

## About the transcription

The text was produced by transcribing each scanned page with a vision language model, at the original scan
resolution. Traditional, variant, and non-standard character forms are kept as printed rather than
normalised, so the transcription can be read against the original without silent modernisation.

The transcription exists to make the run searchable and readable. **For quotation, please consult the
original scans.** The complete collection is distributed by the Chinese Radio Amateurs Club
([CRAC](http://www.crac.org.cn/News/Detail?ID=3032)) 中国无线电协会业余无线电分会 — the channel chosen by
those who digitised and released it — and the same download page linked from
[Radio Periodicals 1928-1949]({{ '/periodicals/' | relative_url }}) also serves this title.

<script>
  window.QA_BASE = "{{ '/assets/qa/' | relative_url }}";
  window.QA_READ = "{{ '/periodicals/radio-qa/read/' | relative_url }}";
</script>
<script src="{{ '/assets/qa/search.js' | relative_url }}"></script>
