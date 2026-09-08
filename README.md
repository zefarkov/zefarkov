# zefarkov.uz

Simple portfolio site for Farrukh Abdurazzokov.

## Content principle

The site is written for a one-minute scan by both recruiters and infrastructure engineers:
- concrete technologies;
- concrete scope;
- short experience lines;
- project need / work / result;
- no filler or invented metrics.

Main content is in `assets/js/content.js`.


## Canonical URL

Production is normalized to `https://zefarkov.uz/`:
- section navigation never writes hashes;
- query strings / `index.html` are removed from the address bar on production;
- `www.zefarkov.uz` redirects to the apex domain;
- unknown static paths are redirected to the root through `404.html`.

Deploy the **contents of this folder** at the site root.
