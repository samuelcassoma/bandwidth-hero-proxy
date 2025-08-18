import https from 'https'
import http from 'http'
import sharp from 'sharp'

export default async function handler(req, res) {
  const { url, quality = 40 } = req.query

  if (!url) {
    res.status(400).send('Missing "url" parameter')
    return
  }

  try {
    const client = url.startsWith('https') ? https : http
    client.get(url, (response) => {
      let data = []
      response.on('data', (chunk) => data.push(chunk))
      response.on('end', async () => {
        try {
          const buffer = Buffer.concat(data)
          const compressed = await sharp(buffer)
            .jpeg({ quality: parseInt(quality), progressive: true })
            .toBuffer()

          res.setHeader('Content-Type', 'image/jpeg')
          res.send(compressed)
        } catch (err) {
          res.status(500).send('Image processing error: ' + err.message)
        }
      })
    }).on('error', (err) => {
      res.status(500).send('Download error: ' + err.message)
    })
  } catch (err) {
    res.status(500).send('Unexpected error: ' + err.message)
  }
}
