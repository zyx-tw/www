# Maple Mono NF CN

Maple Mono 7.9 from [subframe7536/maple-font](https://github.com/subframe7536/maple-font): `MapleMono-NF-CN-Regular.ttf` and `MapleMono-NF-CN-SemiBold.ttf` from `MapleMono-NF-CN.zip`. SIL Open Font License 1.1, see [LICENSE.txt](LICENSE.txt). `apps/ui/public/fonts/` serves the same files to projects outside this repo (`maple-mono-nf-cn.css` there, which a project links in its head).

Each weight comes in two files. `MapleMonoNFCN-<weight>.woff2` holds Latin, general punctuation, arrows, technical symbols, box drawing, block elements and geometric shapes, about 60 KB, and every page preloads it. `MapleMonoNFCN-<weight>-CJK.woff2` holds CJK punctuation, full width forms and the Han characters in `cjk.txt`: every Han character in the apps' text (`apps/*/app`, `components`, `lib`, except Plump). Its `unicode-range` keeps a page with no Han text from downloading it. Han characters outside the subset fall back to Noto Sans TC. `apps/ui/public/fonts/` serves only the Latin files; there the slices below cover the Han characters.

Collect `cjk.txt` again when the apps' text gains new Han characters. From the repository root:

```bash
grep -rhoP '\p{Han}' apps/{1909,good,link,time,ui,web}/{app,components,lib} 2>/dev/null \
  | sort -u | tr -d '\n' > packages/ui/src/fonts/cjk.txt
```

Then run this in an empty directory that holds a copy of `cjk.txt`. Copy the four files into `packages/ui/src/fonts/`, and the two Latin files into `apps/ui/public/fonts/`:

```bash
mkdir -p src
curl -fsSL -o maple.zip https://github.com/subframe7536/maple-font/releases/download/v7.9/MapleMono-NF-CN.zip
unzip -q maple.zip -d src
L='U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2190-21FF,U+2212,U+2215,U+2300-23FF,U+2500-25FF,U+FEFF,U+FFFD'
C='U+3000-303F,U+FF00-FFEF'
for w in Regular SemiBold; do
  uvx --from 'fonttools[woff]==4.60.1' pyftsubset "src/MapleMono-NF-CN-$w.ttf" \
    --unicodes="$L" --layout-features='*' --flavor=woff2 \
    --output-file="MapleMonoNFCN-$w.woff2"
  uvx --from 'fonttools[woff]==4.60.1' pyftsubset "src/MapleMono-NF-CN-$w.ttf" \
    --unicodes="$C" --text-file=cjk.txt --layout-features='*' --flavor=woff2 \
    --output-file="MapleMonoNFCN-$w-CJK.woff2"
done
```

## Every other Han character

Text that comes from data (a file name, a merchant on a bank statement) uses Han characters outside `cjk.txt`. `apps/ui/public/fonts/maple-mono-nf-cn.css` covers them with the same face: after the two subset files it lists 95 slices per weight in `fonts/cjk/`, each with a `unicode-range`, so a page downloads only the slices its text needs. Apps in this repository do not load them: all their Han characters are in `cjk.txt`.

To cut the slices again, in the directory that holds `src/` from the step above:

```bash
curl -fsSL -A 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36' \
  -o noto.css 'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400'
mkdir -p cjk
uvx --from 'fonttools[woff]==4.60.1' python slice-cjk.py
```

Copy `cjk/*.woff2` into `apps/ui/public/fonts/cjk/` and replace the slice faces in `maple-mono-nf-cn.css` with `cjk/faces.css`.
