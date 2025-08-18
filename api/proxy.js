import sharp from "sharp";

export default async function handler(req, res) {
  try {
    const { url, quality } = req.query;
    if (!url) {
      res.status(400).send("Missing url parameter");
      return;
    }

    const q = parseInt(quality) || 60;

    // Fetch com headers para não ser bloqueado
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      res.status(response.status).send("Failed to fetch image");
      return;
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    // Converte para JPEG comprimido
    const output = await sharp(buffer)
      .jpeg({ quality: q })
      .toBuffer();

    res.setHeader("Content-Type", "image/jpeg");
    res.send(output);
  } catch (err) {
    res.status(500).send("Internal server error: " + err.message);
  }
}
