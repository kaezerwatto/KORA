import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import puppeteer from "puppeteer-core";

const root = path.resolve(import.meta.dirname, "..");
const output = path.join(root, "release", "kora-pitch-demo.webm");
const html = path.join(root, "submission", "pitch-video.html");
const audioDirectory = path.join(root, "submission", "audio");

const audioFiles = [
  "01-probleme.mp3",
  "02-activation.mp3",
  "03-integrite.mp3",
  "04-dynamique.mp3",
  "05-architecture.mp3",
  "06-modele-tests.mp3",
  "07-conclusion.mp3"
].map((name) => pathToFileURL(path.join(audioDirectory, name)).href);

await mkdir(path.dirname(output), { recursive: true });

const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--allow-file-access-from-files",
    "--autoplay-policy=no-user-gesture-required"
  ]
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(html).href, { waitUntil: "load" });

  await page.exposeFunction("saveKoraVideo", async (dataUrl) => {
    const base64 = dataUrl.slice(dataUrl.lastIndexOf(",") + 1);
    await writeFile(output, Buffer.from(base64, "base64"));
  });

  const result = await page.evaluate(async ({ audioFiles }) => {
    const canvas = document.querySelector("#stage");
    const ctx = canvas.getContext("2d", { alpha: false });
    const W = canvas.width;
    const H = canvas.height;

    const assets = {
      logo: "../src/icons/icon-128.png",
      popup: "../docs/assets/kora-popup.png",
      dashboard: "assets/pitch-dashboard.png",
      fees: "assets/pitch-fees.png",
      injection: "assets/pitch-injection.png"
    };

    const images = {};
    await Promise.all(
      Object.entries(assets).map(
        ([key, source]) =>
          new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => {
              images[key] = image;
              resolve();
            };
            image.onerror = reject;
            image.src = source;
          })
      )
    );

    const roundRect = (x, y, width, height, radius) => {
      const r = Math.min(radius, width / 2, height / 2);
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + width, y, x + width, y + height, r);
      ctx.arcTo(x + width, y + height, x, y + height, r);
      ctx.arcTo(x, y + height, x, y, r);
      ctx.arcTo(x, y, x + width, y, r);
      ctx.closePath();
    };

    const wrapText = (text, x, y, maxWidth, lineHeight, maxLines = 6) => {
      const words = text.split(/\s+/);
      let line = "";
      let lineIndex = 0;
      for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        if (ctx.measureText(test).width > maxWidth && line) {
          ctx.fillText(line, x, y + lineIndex * lineHeight);
          line = word;
          lineIndex += 1;
          if (lineIndex >= maxLines - 1) break;
        } else {
          line = test;
        }
      }
      if (lineIndex < maxLines) ctx.fillText(line, x, y + lineIndex * lineHeight);
      return y + (lineIndex + 1) * lineHeight;
    };

    const drawBackground = (index, progress) => {
      ctx.fillStyle = "#08100c";
      ctx.fillRect(0, 0, W, H);

      const glow = ctx.createRadialGradient(1100, 70, 20, 1100, 70, 500);
      glow.addColorStop(0, "rgba(35, 190, 151, .23)");
      glow.addColorStop(1, "rgba(8, 16, 12, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);

      ctx.drawImage(images.logo, 56, 38, 56, 56);
      ctx.fillStyle = "#ffffff";
      ctx.font = "700 26px DejaVu Sans, Arial";
      ctx.fillText("KORA", 130, 74);
      ctx.fillStyle = "#7f9b90";
      ctx.font = "500 14px DejaVu Sans, Arial";
      ctx.fillText("Traduction financière privée et locale", 130, 95);

      ctx.fillStyle = "#6e887e";
      ctx.textAlign = "right";
      ctx.font = "600 13px DejaVu Sans, Arial";
      ctx.fillText(`SAFINUM INNOVATE CHALLENGE 2026  ·  ${index + 1}/7`, 1224, 67);
      ctx.textAlign = "left";

      ctx.fillStyle = "#12231c";
      ctx.fillRect(56, 680, 1168, 4);
      ctx.fillStyle = "#27c49c";
      ctx.fillRect(56, 680, 1168 * ((index + progress) / 7), 4);
      ctx.fillStyle = "#6e887e";
      ctx.font = "500 12px DejaVu Sans, Arial";
      ctx.fillText("KORA TEAM · Yaoundé, Cameroun", 56, 706);
      ctx.textAlign = "right";
      ctx.fillText("github.com/kaezerwatto/KORA", 1224, 706);
      ctx.textAlign = "left";
    };

    const drawHeading = (eyebrow, title, subtitle, width = 470) => {
      ctx.fillStyle = "#edbd45";
      ctx.font = "800 14px DejaVu Sans, Arial";
      ctx.fillText(eyebrow.toUpperCase(), 58, 158);
      ctx.fillStyle = "#ffffff";
      ctx.font = "800 43px DejaVu Sans, Arial";
      const afterTitle = wrapText(title, 58, 214, width, 50, 4);
      ctx.fillStyle = "#aac1b7";
      ctx.font = "400 19px DejaVu Sans, Arial";
      wrapText(subtitle, 58, afterTitle + 18, width, 30, 6);
    };

    const drawImageCard = (image, x, y, width, height, sourceCrop = null) => {
      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, .38)";
      ctx.shadowBlur = 30;
      ctx.shadowOffsetY = 12;
      roundRect(x, y, width, height, 18);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.clip();
      if (sourceCrop) {
        ctx.drawImage(
          image,
          sourceCrop.x,
          sourceCrop.y,
          sourceCrop.width,
          sourceCrop.height,
          x,
          y,
          width,
          height
        );
      } else {
        ctx.drawImage(image, x, y, width, height);
      }
      ctx.restore();
    };

    const pill = (text, x, y, color = "#27c49c") => {
      ctx.font = "700 14px DejaVu Sans, Arial";
      const width = ctx.measureText(text).width + 30;
      roundRect(x, y, width, 34, 17);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.fillStyle = "#08100c";
      ctx.fillText(text, x + 15, y + 22);
      return width;
    };

    const metric = (value, label, x, y, width = 210) => {
      roundRect(x, y, width, 98, 15);
      ctx.fillStyle = "#12231c";
      ctx.fill();
      ctx.strokeStyle = "#24463a";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = "#55d8b5";
      ctx.font = "800 27px DejaVu Sans, Arial";
      ctx.fillText(value, x + 20, y + 39);
      ctx.fillStyle = "#8eaaa0";
      ctx.font = "500 13px DejaVu Sans, Arial";
      wrapText(label, x + 20, y + 66, width - 40, 18, 2);
    };

    const drawArchitecture = () => {
      const nodes = [
        ["POPUP", "activation"],
        ["DOM", "mutations"],
        ["MOTEUR", "protection"],
        ["MÉMOIRES", "FR / EN"],
        ["MODÈLES", "fluidité"]
      ];
      const startX = 58;
      const y = 338;
      const width = 208;
      nodes.forEach(([name, detail], index) => {
        const x = startX + index * 237;
        roundRect(x, y, width, 120, 16);
        ctx.fillStyle = index === 2 ? "#0f846b" : "#12231c";
        ctx.fill();
        ctx.strokeStyle = index === 2 ? "#48d2ae" : "#315447";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = "#ffffff";
        ctx.font = "800 18px DejaVu Sans, Arial";
        ctx.textAlign = "center";
        ctx.fillText(name, x + width / 2, y + 49);
        ctx.fillStyle = index === 2 ? "#d9fff4" : "#86a398";
        ctx.font = "500 14px DejaVu Sans, Arial";
        ctx.fillText(detail, x + width / 2, y + 79);
        ctx.textAlign = "left";
        if (index < nodes.length - 1) {
          ctx.fillStyle = "#edbd45";
          ctx.font = "800 30px DejaVu Sans, Arial";
          ctx.fillText("›", x + width + 10, y + 70);
        }
      });
      ctx.fillStyle = "#8eaaa0";
      ctx.font = "500 17px DejaVu Sans, Arial";
      ctx.textAlign = "center";
      ctx.fillText("Aucun texte de page ne quitte cet ordinateur", W / 2, 506);
      ctx.textAlign = "left";
    };

    const drawSlide = (index, progress) => {
      drawBackground(index, progress);
      if (index === 0) {
        drawHeading(
          "Le problème",
          "Comprendre sa finance dans sa langue",
          "KORA traduit une interface financière existante vers le fulfulde de l’Adamaoua, sans modifier le service.",
          720
        );
        metric("FR + EN", "vers Adamawa Fulfulde", 58, 470, 250);
        metric("100 % local", "sans serveur de traduction", 328, 470, 270);
        metric("Valeurs intactes", "montants, noms et références", 618, 470, 290);
        ctx.save();
        ctx.globalAlpha = 0.95;
        ctx.drawImage(images.logo, 1000, 210, 170, 170);
        ctx.restore();
      } else if (index === 1) {
        drawHeading(
          "Une action",
          "Choisir Fulfulde",
          "La popup active la traduction locale. Français ou English restaure immédiatement le texte d’origine.",
          540
        );
        pill("Hors ligne", 58, 470);
        pill("Sans télémétrie", 176, 470, "#edbd45");
        drawImageCard(
          images.popup,
          800,
          125,
          360,
          330,
          { x: 0, y: 0, width: images.popup.width, height: 540 }
        );
      } else if (index === 2) {
        const showingFees = progress > 0.56;
        drawHeading(
          "Intégrité financière",
          showingFees ? "Les calculs restent au service" : "Les valeurs restent identiques",
          showingFees
            ? "KORA traduit les libellés. Safinum conserve les montants, les frais et le total."
            : "Solde, compte, dates, transactions et devise sont protégés avant toute traduction.",
          470
        );
        pill(showingFees ? "25 000 FCFA + 0 FCFA" : "250 000 FCFA intact", 58, 500);
        drawImageCard(showingFees ? images.fees : images.dashboard, 560, 126, 664, 415);
      } else if (index === 3) {
        drawHeading(
          "Contenu dynamique",
          "Même injecté. Même mal écrit.",
          "Le MutationObserver détecte l’ajout. Le correcteur choisit uniquement un sens financier non ambigu.",
          470
        );
        ctx.fillStyle = "#819d92";
        ctx.font = "500 17px DejaVu Sans Mono, monospace";
        ctx.fillText("sodle insufisant", 58, 472);
        ctx.fillStyle = "#edbd45";
        ctx.font = "800 28px DejaVu Sans, Arial";
        ctx.fillText("↓", 58, 510);
        ctx.fillStyle = "#55d8b5";
        ctx.font = "800 24px DejaVu Sans, Arial";
        ctx.fillText("Kaalisi yonaa", 58, 550);
        drawImageCard(images.injection, 560, 126, 664, 415);
      } else if (index === 4) {
        drawHeading(
          "Architecture",
          "Une chaîne explicable et locale",
          "Chaque compartiment a un rôle précis : observer, protéger, traduire, classer et restaurer.",
          760
        );
        drawArchitecture();
      } else if (index === 5) {
        drawHeading(
          "Modèles et preuves",
          "Léger, embarqué, reproductible",
          "Les modèles classent des formulations sûres. Les mémoires contrôlées portent le sens financier.",
          760
        );
        metric("504", "concepts financiers", 58, 388, 260);
        metric("185 120", "paramètres neuronaux int8", 338, 388, 260);
        metric("1 252", "fautes orthographiques testées", 618, 388, 280);
        metric("27 / 27", "tests unitaires réussis", 918, 388, 260);
        pill("Safinum ✓", 58, 520);
        pill("UBA ✓", 186, 520, "#edbd45");
        pill("Popup et pages ✓", 278, 520);
      } else {
        drawHeading(
          "KORA TEAM",
          "Traduire les mots. Protéger l’opération.",
          "Une extension reproductible, privée et conçue pour rendre la finance numérique camerounaise plus accessible.",
          760
        );
        ctx.drawImage(images.logo, 950, 175, 190, 190);
        pill("Dépôt public", 58, 480);
        pill("Extension installable", 194, 480, "#edbd45");
        ctx.fillStyle = "#ffffff";
        ctx.font = "700 22px DejaVu Sans, Arial";
        ctx.fillText("github.com/kaezerwatto/KORA", 58, 570);
      }
    };

    const audioContext = new AudioContext();
    const destination = audioContext.createMediaStreamDestination();
    const audioElements = [];
    for (const source of audioFiles) {
      const audio = new Audio(source);
      audio.preload = "auto";
      await new Promise((resolve, reject) => {
        audio.addEventListener("loadedmetadata", resolve, { once: true });
        audio.addEventListener("error", reject, { once: true });
        audio.load();
      });
      const node = audioContext.createMediaElementSource(audio);
      node.connect(destination);
      audioElements.push(audio);
    }

    await audioContext.resume();
    drawSlide(0, 0);
    const videoStream = canvas.captureStream(10);
    const stream = new MediaStream([
      videoStream.getVideoTracks()[0],
      destination.stream.getAudioTracks()[0]
    ]);
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
      ? "video/webm;codecs=vp9,opus"
      : "video/webm;codecs=vp8,opus";
    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 330_000,
      audioBitsPerSecond: 48_000
    });
    const chunks = [];
    recorder.addEventListener("dataavailable", (event) => {
      if (event.data.size) chunks.push(event.data);
    });
    const stopped = new Promise((resolve) =>
      recorder.addEventListener("stop", resolve, { once: true })
    );

    recorder.start(1000);
    await new Promise((resolve) => setTimeout(resolve, 500));

    for (let index = 0; index < audioElements.length; index += 1) {
      const audio = audioElements[index];
      drawSlide(index, 0);
      await audio.play();
      await new Promise((resolve) => {
        const frame = () => {
          const progress = Number.isFinite(audio.duration) && audio.duration > 0
            ? Math.min(1, audio.currentTime / audio.duration)
            : 0;
          drawSlide(index, progress);
          if (audio.ended) resolve();
          else requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
      });
      drawSlide(index, 1);
      await new Promise((resolve) => setTimeout(resolve, 350));
    }

    recorder.stop();
    await stopped;
    const blob = new Blob(chunks, { type: mimeType });
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    await window.saveKoraVideo(dataUrl);
    return { bytes: blob.size, mimeType };
  }, { audioFiles });

  console.log(
    `Created ${path.relative(root, output)} (${(result.bytes / 1024 / 1024).toFixed(2)} MiB, ${result.mimeType})`
  );
} finally {
  await browser.close();
}
