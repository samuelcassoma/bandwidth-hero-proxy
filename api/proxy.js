import http from "http";
import https from "https";
import sharp from "sharp";

export default async function handler(req, res) {
  try {
    const url = req.query.url;
    const quality = parseInt(req.query.quality) || 60;

    if (!url) {
      res.status(400).send("Missing url parameter");
      return;
    }

    const client = url.startsWith("https") ? https : http;

    const options = new URL(url);
    options.headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0 Safari/537.36",
      "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Cache-Control": "no-cache",
    };

    client.get(options, (response) => {
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
            .jpeg({ quality: Math.min(Math.max(quality, 10), 100) })
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
