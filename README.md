# Our story

A static site with one chapter for each monthsary and anniversary. It uses plain HTML, CSS, and JavaScript with no build step.

Live site: https://1vannce-alt.github.io/our-story/

## Folder structure

```
our-story/
├── index.html          Landing page with Open and Copy link buttons for every chapter
├── monthsary/
│   ├── chapter-01/     Website: index.html, script.js, style.css, assets/
│   └── chapter-02/     README.md only. This chapter is an external DigiBouquet link.
├── anniversary/        Empty for now
├── .env.example        Names of the local secrets
└── .gitignore          Keeps .env out of git
```

## Add a chapter

1. Create `monthsary/chapter-NN/` or `anniversary/chapter-NN/`. NN is the monthsary or anniversary number, so chapter 03 is the 3rd monthsary.
2. For a website chapter, put `index.html` and its files in that folder. Use relative paths such as `style.css` and `assets/photo.jpg`.
3. For an external chapter, such as a DigiBouquet link, add a `README.md` with the link.
4. Add one line to the `chapters` list in the root `index.html`. The anniversary section appears on the landing page once it has a chapter.

## Secrets

This repo is public, and GitHub Pages serves every committed file. Passwords and keys go in a local `.env` file, which git ignores. Copy `.env.example` to `.env` and fill in the values. When you add a new secret, add its name with an empty value to `.env.example`.

`.env` is only a local note. The site cannot read it, and any value a page uses is public.
