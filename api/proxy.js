import http from "http";
import https from "https";
import sharp from "sharp";

export default async function handler(req, res) {
  try {
    const url = req.query.url;
    if (!url) {
      res.status(400).send("Missing url parameter");
      return;
    }

    const client = url.startsWith("https") ? https : http;

    const options = {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "*/*",
      },
    };

    client
      .get(url, options, (response) => {
        // se for redirecionamento (301/302), seguir para o novo destino
        if (
          response.statusCode >= 300 &&
          response.statusCode < 400 &&
          response.headers.location
        ) {
          return handler({ query: { url: response.headers.location } }, res);
        }

        if (response.statusCode !== 200) {
          res.status(response.statusCode).send("Failed to fetch image");
          return;
        }

        let data = [];
        response.on("data", (chunk) => data.push(chunk));
        response.on("end", async () => {
          try {
            const buffer = Buffer.concat(data);

            // converte para JPEG, qualidade 60 (padrão)
            const output = await sharp(buffer).jpeg({ quality: 60 }).toBuffer();

            res.setHeader("Content-Type", "image/jpeg");
            res.send(output);
          } catch (err) {
            res.status(500).send("Error processing image: " + err.message);
          }
        });
      })
      .on("error", () => {
        res.status(500).send("Error fetching image");
      });
  } catch (err) {
    res.status(500).send("Internal server error");
  }
}
