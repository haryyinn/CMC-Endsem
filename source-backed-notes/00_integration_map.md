# Module 3 CMC Notes Integration Map

This folder contains source-backed Markdown notes prepared for later conversion into the modular HTML template.

## Current Files

| Order | File | Primary source PDF | Textbook mapping | Status |
|---:|---|---|---|---|
| 1 | `01_introduction_and_product.md` | `Introduction to 4ps  Product.pdf` | `Textbook_CMC.pdf` Chapters 8 and 9 | Complete |
| 2 | `02_pricing.md` | `Pricing.pdf` | `Textbook_CMC.pdf` Chapters 10 and 11 | Complete |
| 3 | `03_branding.md` | `Branding.pdf` | `Textbook_CMC.pdf` Chapter 8 | Complete |
| 4 | `04_promotion_imc.md` | `IMC _Promotion.pdf` | `Textbook_CMC.pdf` Chapters 14, 15, and 16 | Complete |
| 5 | `05_competitive_strategies.md` | `Competitive Strategies .pdf` | `Textbook_CMC.pdf` Chapter 18 | Complete |
| 6 | `06_cases.md` | `9. Pepperfry com-2.pdf`, `10. When Your Brand Is Racist.pdf`, `11. A Fast-Food Company-2.pdf`, `12. Kumar Food Corporation-2.pdf`, `13. Ariels #ShareTheLoad-2.pdf` | Mapped to Ch. 8, 9, 10, 11, 14, 15, 16, 18 | Complete |
| 7 | `07_sustainability_marketing.md` | `14. How to Market Sustainable Products.pdf` (HBR, Dalsace & Challagalla, Mar–Apr 2024) | Supplementary — maps to product differentiation (Ch. 8), segmentation, pricing (Ch. 10–11), IMC (Ch. 14) | Complete |

## Official Outline Used

`CMC_course outline IIMK_Marketing mix.pdf` was inspected and used as the highest-priority source.

Module 3 official sequence:

1. Product Basics
2. Branding Basics
3. Pricing Basics
4. Place / Distribution
5. Promotion & Integrated Marketing Communication
6. Competitive Dynamics

## Provided Concept Files Covered

The user-requested sequence was:

1. Introduction / Product
2. Pricing
3. Branding
4. Promotion / IMC
5. Competitive Strategies

## Not Yet Covered

| Missing area | Reason |
|---|---|
| Place / Distribution | Official outline includes Place, but no Place/Distribution PDF was provided in the requested file batch. |
| Detailed case facts | All five case PDFs (9–13) are now covered in `06_cases.md`. |
| Direct HTML `notes-data.js` integration | Deferred until the user asks to plug these notes into the live template. |

## HTML Conversion Guidance

Each major `#` topic in the Markdown files can become one concept object inside:

`/Users/hariharan/CascadeProjects/windsurf-project/module3-product-mix-template/notes-data.js`

Recommended concept grouping:

| Markdown source | Suggested HTML category |
|---|---|
| `01_introduction_and_product.md` | Product Foundations / Product Strategy |
| `02_pricing.md` | Pricing |
| `03_branding.md` | Branding |
| `04_promotion_imc.md` | Promotion and IMC |
| `05_competitive_strategies.md` | Competitive Strategy |
| `06_cases.md` | Cases |
| `07_sustainability_marketing.md` | Sustainability Marketing (Supplementary) |

## Accuracy Rules Preserved

- Official outline prioritized.
- Lecture slides treated as primary concept source.
- Textbook used for mapping and deeper reinforcement.
- General marketing context explicitly labelled where not directly from provided material.
- Missing case facts: all five case PDFs (9–13) provided and covered in `06_cases.md`. File 14 (HBR sustainability article) covered in `07_sustainability_marketing.md`.
- Possible slide-label inconsistency in Branding architecture flagged neutrally.
