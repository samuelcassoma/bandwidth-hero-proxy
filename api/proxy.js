import http from "http";
import https from "https";
import sharp from "sharp";

export default async function handler(req, res) {
  try {
    const url = req.query.url;
    const quality = parseInt(req.query.quality) || 60; // padrão 60 se não passar nada

    if (!url) {
      res.status(400).send("Missing url parameter");
      return;
    }

    const client = url.startsWith("https") ? https : http;

    client.get(url, (response) => {
      if (response.statusCode !== 200) {
        res.status(response.statusCode).send("Failed to fetch image");
        return;
      }

      let data = [];
      response.on("data", (chunk) => data.push(chunk));
      response.on("end", async () => {
        try {
          const buffer = Buffer.concat(data);

          // Redimensiona para no máximo 1080px de largura e aplica qualidade
          const output = await sharp(buffer)
            .resize({ width: 1080, withoutEnlargement: true })
            .jpeg({ quality: Math.min(Math.max(quality, 40), 80) })
            .toBuffer();

          res.setHeader("Content-Type", "image/jpeg");
          res.send(output);
        } catch (err) {
          res.status(500).send("Error processing image: " + err.message);
        }
      });
    }).on("error", () => {
      res.status(500).send("Error fetching image");
    });
  } catch (err) {
    res.status(500).send("Internal server error");
  }
}
