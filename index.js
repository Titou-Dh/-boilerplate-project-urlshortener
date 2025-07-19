require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dns = require("dns");
const url = require("url");
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use("/public", express.static(`${process.cwd()}/public`));

// In-memory storage for URLs (in production, you'd use a database)
const urlDatabase = {};
let urlCounter = 1;

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

// URL shortener POST endpoint
app.post("/api/shorturl", function (req, res) {
  const originalUrl = req.body.url;

  // Validate URL format
  let parsedUrl;
  try {
    parsedUrl = new URL(originalUrl);

    // Check if protocol is http or https
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return res.json({ error: "invalid url" });
    }
  } catch (err) {
    return res.json({ error: "invalid url" });
  }

  // Use DNS lookup to verify the URL
  dns.lookup(parsedUrl.hostname, (err, address) => {
    if (err) {
      return res.json({ error: "invalid url" });
    }

    // Check if URL already exists in database
    for (let id in urlDatabase) {
      if (urlDatabase[id] === originalUrl) {
        return res.json({
          original_url: originalUrl,
          short_url: parseInt(id),
        });
      }
    }

    // Store new URL
    const shortUrl = urlCounter++;
    urlDatabase[shortUrl] = originalUrl;

    res.json({
      original_url: originalUrl,
      short_url: shortUrl,
    });
  });
});

// URL shortener GET endpoint for redirection
app.get("/api/shorturl/:short_url", function (req, res) {
  const shortUrl = req.params.short_url;
  const originalUrl = urlDatabase[shortUrl];

  if (originalUrl) {
    res.redirect(originalUrl);
  } else {
    res.json({ error: "No short URL found for the given input" });
  }
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
