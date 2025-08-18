import http from "http";
import https from "https";
import sharp from "sharp";

export default async function handler(req, res) {
  try {
    const url = req.query.url;
    let quality = parseInt(req.query.quality) || 60; // qualidade padrão 60

    if (quality < 40) quality = 40;
    if (quality > 80) quality = 80;

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

          const output = await sharp(buffer)
            .jpeg({ quality })
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
