import fs from "fs";
import path from "path";
import sharp from "sharp";

const root = process.cwd();
const dir = path.join(root, "public", "portfolio");

const thumbsDir = path.join(dir, "_thumbs");
const fullDir = path.join(dir, "_full");

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
const VIDEO_EXT = new Set([".mp4", ".mov", ".webm"]);

function ensure(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function numericKey(name) {
  const m = name.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : Number.MAX_SAFE_INTEGER;
}

function safeBaseName(file) {
  // usa número com padding quando existir (ex: 4.jpg => 004)
  const ext = path.extname(file).toLowerCase();
  const base = path.basename(file, ext);
  const m = base.match(/(\d+)/);
  if (m) return String(parseInt(m[1], 10)).padStart(4, "0"); // 0004, 0010...
  // fallback
  return base.replace(/\s+/g, "-").toLowerCase();
}

async function build() {
  if (!fs.existsSync(dir)) {
    console.error("Pasta não existe:", dir);
    process.exit(1);
  }

  ensure(thumbsDir);
  ensure(fullDir);

  const entries = fs
    .readdirSync(dir)
    .filter((f) => !f.startsWith("."))
    .filter((f) => f !== "list.json")
    .filter((f) => f !== "_thumbs" && f !== "_full")
    .filter((f) => !f.startsWith("__MACOSX"));

  // separa imgs e vídeos
  const images = [];
  const videos = [];

  for (const f of entries) {
    const ext = path.extname(f).toLowerCase();
    if (IMAGE_EXT.has(ext)) images.push(f);
    else if (VIDEO_EXT.has(ext)) videos.push(f);
  }

  images.sort((a, b) => numericKey(a) - numericKey(b));
  videos.sort((a, b) => numericKey(a) - numericKey(b));

  const list = [];

  // IMAGENS => gera thumb + full
  for (const file of images) {
    const input = path.join(dir, file);
    const base = safeBaseName(file);

    const outThumb = path.join(thumbsDir, `${base}.webp`);
    const outFull = path.join(fullDir, `${base}.webp`);

    // thumb (grid)
    if (!fs.existsSync(outThumb)) {
      await sharp(input)
        .rotate()
        .resize({ width: 700 }) // grid leve
        .webp({ quality: 72 })
        .toFile(outThumb);
    }

    // full (modal)
    if (!fs.existsSync(outFull)) {
      await sharp(input)
        .rotate()
        .resize({ width: 2000 }) // modal com qualidade, bem menor que 40MB
        .webp({ quality: 78 })
        .toFile(outFull);
    }

    list.push({
      type: "image",
      thumb: `/portfolio/_thumbs/${base}.webp`,
      src: `/portfolio/_full/${base}.webp`,
      name: file,
    });
  }

  // VÍDEOS => entram como original (por enquanto)
  for (const file of videos) {
    list.push({
      type: "video",
      src: `/portfolio/${file}`,
      name: file,
    });
  }

  fs.writeFileSync(path.join(dir, "list.json"), JSON.stringify(list, null, 2), "utf-8");
  console.log("✅ Gerado:", path.join(dir, "list.json"));
  console.log("✅ Thumbs:", thumbsDir);
  console.log("✅ Full:", fullDir);
}

build().catch((e) => {
  console.error(e);
  process.exit(1);
});
