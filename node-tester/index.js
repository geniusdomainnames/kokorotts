// test-tts.js — Test the Kokoro TTS Modal endpoint
// Usage:  node test-tts.js
//         node test-tts.js "Hello world" af_bella 1.2

const fs = require("fs");
const https = require("https");

const BASE_URL = "geniusdomainnames--kokoro-tts-web.modal.run";

function post(text, voice, speed) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      text: text,
      voice: voice,
      speed: speed,
      format: "wav",
      lang_code: "a",
    });

    const options = {
      hostname: BASE_URL,
      path: "/synthesize",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
    };

    const chunks = [];

    const req = https.request(options, function (res) {
      console.log("Status:", res.statusCode);

      res.on("data", function (chunk) {
        chunks.push(chunk);
      });

      res.on("end", function () {
        if (res.statusCode !== 200) {
          return reject(new Error("HTTP " + res.statusCode + ": " + Buffer.concat(chunks).toString()));
        }
        resolve(Buffer.concat(chunks));
      });
    });

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

const text  = process.argv[2] || "Hello! This is Kokoro text to speech.";
const voice = process.argv[3] || "af_heart";
const speed = parseFloat(process.argv[4]) || 1.0;

console.log('Text  :', text);
console.log('Voice :', voice);
console.log('Speed :', speed);

post(text, voice, speed)
  .then(function (buffer) {
    fs.writeFileSync("output.wav", buffer);
    console.log("Saved -> output.wav (" + (buffer.length / 1024).toFixed(1) + " KB)");
  })
  .catch(function (err) {
    console.error("Error:", err.message);
  });