# IEEE Final PDF Build and Visual Inspection Report

## 1. Build command

Environment:

- XeLaTeX: MiKTeX XeTeX 3.141592653-2.6-0.999997
- MiKTeX: 25.12
- IEEEtran: V1.8b
- Main font requested: Times New Roman

Commands executed from `D:\KLTN_NovaCare`:

```text
xelatex -interaction=nonstopmode -file-line-error main.tex
xelatex -interaction=nonstopmode -file-line-error main.tex
```

The second pass was run to settle cross-references and bibliography/citation output.

## 2. Build result

Build completed successfully on both passes. The resulting file is `main.pdf`.

- Pages: 6
- Page size: 612 × 792 pt, US Letter
- PDF producer: MiKTeX `dvipdfmx`
- PDF is not encrypted
- No LaTeX fatal error
- No undefined-reference, undefined-citation or missing-file diagnostic was found in `main.log`

Before the final rebuild, the first generated PDF was preserved as `main_pre_balance.pdf`.

## 3. Presentation adjustment made

Added `\balance` before the acknowledgment/references area in `main.tex` so the final IEEE two-column page is balanced more closely. This changed presentation only; no research content, numerical value, source code, JSON/CSV artifact or reference entry was changed.

## 4. Visual inspection

All six rendered PDF pages were inspected visually after the final build.

- IEEE conference two-column structure is present.
- Title, author block, affiliation and underlined email render correctly.
- Abstract and Index Terms are placed correctly beneath the author block.
- No blank page was observed.
- No clipped text, missing glyph, table overflow or figure overflow was observed.
- Tables I–V remain readable and within the column/page boundaries.
- Latency and over-capacity figures render in the intended columns and captions are visible.
- Equations (1)–(6) render with equation numbers and no clipping.
- References occupy the final page without clipping.
- Final-page columns are balanced more closely after adding `\balance`.

## 5. Remaining warnings

### Font fallback warnings

MiKTeX reports missing `TU/ptm` font shapes and substitutes `TU/lmr` for some normal, bold and italic shapes. The PDF remains readable and the requested Times New Roman text renders, but the font setup is not completely warning-free. This should be checked against the target IEEE venue/font policy before camera-ready submission.

### Underfull box

One underfull box remains at `main.tex:317–318` in the Conclusion. It is a line-spacing/justification warning, not clipped or missing content. Visual inspection found no material layout defect at that location.

### MiKTeX update notice

MiKTeX prints a non-blocking notice that updates have not been checked. It is an environment notice, not a manuscript or compilation failure.

## 6. Content and artifact integrity

No V0/V1 number was changed. The build uses the already revised `main.tex`; `NOVACARE_FULL_PAPER_DRAFT.md` was not modified during PDF build. Existing JSON/CSV, reports, figures and references were not modified.

## 7. Final conclusion

**READY FOR SUBMISSION FORMAT REVIEW** — the PDF builds successfully and passes the requested visual inspection for layout, tables, figures, equations, citations, references and author block.

This is not a claim that the paper has passed an IEEE venue’s peer review or camera-ready policy. Before actual submission, confirm the venue’s font requirements and optionally remove the remaining font/underfull warnings if strict source-quality checks are required.
