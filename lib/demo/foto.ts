import { z } from "zod";
// Somente raster codificado: SVG e URLs externas não entram no armazenamento local.
const imagemRasterSchema = z
  .string()
  .max(220000)
  .regex(/^data:image\/(?:webp|png|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/);
export const fotoLocalSchema = imagemRasterSchema.nullable().default(null);
export async function prepararFoto(file: File): Promise<string> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new Error("Escolha uma imagem JPEG, PNG ou WebP.");
  if (file.size > 5 * 1024 * 1024)
    throw new Error("A imagem deve ter até 5 MB.");
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error(
      "Não foi possível ler esta imagem. Escolha outro arquivo JPEG, PNG ou WebP.",
    );
  });
  try {
    if (bitmap.width * bitmap.height > 25000000)
      throw new Error("Escolha uma imagem com até 25 megapixels.");
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 256;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Não foi possível preparar essa imagem.");
    const lado = Math.min(bitmap.width, bitmap.height);
    context.drawImage(
      bitmap,
      (bitmap.width - lado) / 2,
      (bitmap.height - lado) / 2,
      lado,
      lado,
      0,
      0,
      256,
      256,
    );
    return imagemRasterSchema.parse(canvas.toDataURL("image/webp", 0.85));
  } finally {
    bitmap.close();
  }
}
