# Agent Skills (Taste Skill / tasteskill.dev)

Skill frontend dari [tasteskill.dev](https://www.tasteskill.dev/) terpasang di project ini agar UI tidak “ngelantur” / generik AI.

**Lokasi:** `.agents/skills/` (symlink di `.grok/skills/` untuk Grok)

## 13 skill terpasang

| Skill | Kegunaan |
|-------|----------|
| **design-taste-frontend** | Utama — anti-slop, brief inference, pre-flight check |
| design-taste-frontend-v1 | Versi lama (kompatibilitas) |
| **redesign-existing-projects** | Redesign portal existing (audit dulu, jangan pecah fitur) |
| **minimalist-ui** | UI minimal / editorial clean |
| **high-end-visual-design** | Nuansa agency premium |
| **industrial-brutalist-ui** | Brutalist / data-heavy |
| **full-output-enforcement** | Output kode penuh, anti-placeholder `// ...` |
| **gpt-taste** | Motion / GSAP / layout variance ketat |
| brandkit | Generate brand board / identity (image) |
| image-to-code | Design image dulu → implementasi kode |
| imagegen-frontend-web | Generate mock section web (image only) |
| imagegen-frontend-mobile | Generate mock mobile (image only) |
| stitch-design-taste | DESIGN.md semantic system |

## Untuk Scholargate CMS

Saat polish **portal publik** (home, profil, artikel listing), pakai:

1. `design-taste-frontend` + `redesign-existing-projects`
2. Hormati brand peach-soft yang sudah ada (`#FAF6F1`, `#F4E8D9`, brand blue)
3. **Admin/dashboard** di luar scope skill marketing — jaga clean & usable, jangan paksa Awwwards motion di admin

## Reinstall / update

```bash
npx skills add Leonxlnx/taste-skill -y
```
