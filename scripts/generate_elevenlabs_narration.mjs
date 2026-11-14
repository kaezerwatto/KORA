import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const narrationPath = path.join(root, "submission", "video", "narration-fr.json");
const outputDirectory = path.join(root, "submission", "video", "audio");
const mirrorEnv = "/home/kaezer/Bureau/Kora_NAv/.env";

function parseEnv(contents) {
  const values = {};
  for (const rawLine of contents.split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const separator = line.indexOf("=");
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

async function readLocalEnv() {
  for (const file of [path.join(root, ".env"), mirrorEnv]) {
    try {
      return parseEnv(await readFile(file, "utf8"));
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
  return {};
}

const localEnv = await readLocalEnv();
const apiKey =
  process.env.ELEVENLABS_API_KEY ??
  process.env.ELEVENSLABS_API_KEY ??
  localEnv.ELEVENLABS_API_KEY ??
  localEnv.ELEVENSLABS_API_KEY;

if (!apiKey) {
  throw new Error(
    "Clé ElevenLabs absente. Définissez ELEVENLABS_API_KEY dans l’environnement ou dans .env."
  );
}

const narration = JSON.parse(await readFile(narrationPath, "utf8"));
const voiceId = narration.voice.id;
const modelId = narration.voice.model;
await mkdir(outputDirectory, { recursive: true });

const generated = [];
for (const [index, segment] of narration.segments.entries()) {
  const filename = `${String(index + 1).padStart(2, "0")}-${segment.id.replace(
    /^\d+-/u,
    ""
  )}.mp3`;
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey
      },
      body: JSON.stringify({
        text: segment.text,
        model_id: modelId,
        voice_settings: {
          stability: 0.52,
          similarity_boost: 0.82,
          style: 0.16,
          use_speaker_boost: true,
          speed: 1
        }
      })
    }
  );

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 600);
    throw new Error(`ElevenLabs ${response.status} pour ${segment.id}: ${detail}`);
  }

  const audio = Buffer.from(await response.arrayBuffer());
  await writeFile(path.join(outputDirectory, filename), audio);
  generated.push({
    ...segment,
    file: filename,
    bytes: audio.length
  });
  console.log(`Narration ${index + 1}/${narration.segments.length}: ${filename}`);
}

await writeFile(
  path.join(outputDirectory, "manifest.json"),
  `${JSON.stringify(
    {
      title: narration.title,
      voice: narration.voice,
      generatedAt: new Date().toISOString(),
      segments: generated
    },
    null,
    2
  )}\n`
);

console.log(
  `Narration ElevenLabs créée dans ${path.relative(root, outputDirectory)} sans enregistrer la clé.`
);
