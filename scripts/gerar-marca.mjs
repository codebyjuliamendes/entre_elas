// Reconstrói os assets a partir do vetor e das cores versionados, sem rede.
import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";
const source = await readFile(
  new URL("../lib/identidade.ts", import.meta.url),
  "utf8",
);
const d = source.match(/tracoFaisca\s*=\s*"([^"]+)"/)?.[1];
const cor = (nome) =>
  source.match(new RegExp(`${nome}:\\s*"(#[0-9a-f]+)"`, "i"))?.[1];
if (!d || !["azul", "rosaClaro", "coral", "roxo"].every(cor))
  throw new Error("Identidade inválida; assets preservados.");
const dir = new URL("../public/", import.meta.url);
for (const [name, color] of [
  ["simbolo", cor("azul")],
  ["simbolo-branco", "#ffffff"],
  ["simbolo-rosa", cor("rosaClaro")],
]) {
  await writeFile(
    new URL(`marca-${name}.svg`, dir),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 320"><path fill="${color}" fill-rule="evenodd" d="${d}"/></svg>\n`,
  );
}
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><defs><linearGradient id="marca"><stop stop-color="${cor("coral")}"/><stop offset="1" stop-color="${cor("roxo")}"/></linearGradient></defs><rect width="192" height="192" fill="url(#marca)"/><path transform="translate(28 35) scale(.38)" fill="${cor("rosaClaro")}" fill-rule="evenodd" d="${d}"/></svg>\n`;
await writeFile(new URL("icon.svg", dir), svg);
for (const size of [192, 512])
  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toFile(new URL(`icon-${size}.png`, dir).pathname);
console.log(
  "Símbolos SVG e ícones PNG atualizados a partir de lib/identidade.ts.",
);
