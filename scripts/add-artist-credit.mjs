// scripts/add-artist-credit.mjs
import "dotenv/config";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ONE ENTRY = ONE PAIR
// folder = "anime" | "games" | etc.
// base   = similar to pair base name, without -left/-right suffix
const PAIR_CREDITS = [
  {
    folder: "anime",
    base: "winter_momo_okarun",
    artist: "Rappa",
    url: "https://sirrappa.carrd.co/",
  },
  {
    folder: "cartoons",
    base: "Lucililith",
    artist: "KerbeYoshu",
    url: "https://kerbeyoshu.straw.page/",
  },
  {
    folder: "anime",
    base: "Kanade_Honami",
    artist: "Enskkt",
    url: "https://qwew0225.wixsite.com/wakaportfolio",
  },
  {
    folder: "anime",
    base: "Nene_Kusanagi_Emu_Otori",
    artist: "Enskkt",
    url: "https://qwew0225.wixsite.com/wakaportfolio",
  },
  {
    folder: "anime",
    base: "sylveon_girls",
    artist: "CIOSUI",
    url: "https://ciosui.carrd.co/",
  },
  // add more credited pairs here later
];

const PARENT = "categories"; // must match build-pairs.mjs

function cleanBase(base) {
  // strip trailing -left/_left/-right/_right if user included it
  return base.replace(/[-_](left|right)$/i, "");
}

async function findPairPublicIds(folder, base) {
  const clean = cleanBase(base);
  const folderPath = PARENT ? `${PARENT}/${folder}` : folder;

  // Search in this folder for any public_id that starts with the base
  const res = await cloudinary.search
    .expression(`folder:${folderPath} AND public_id:${clean}*`)
    .max_results(20)
    .execute();

  const ids = res.resources
    .map(r => r.public_id) // e.g. "categories/anime/winter_momo_okarun-left"
    .filter(id =>
      id.match(/[-_](left|right)$/i) // only the left/right variants
    );

  return ids;
}

async function run() {
  for (const { folder, base, artist, url } of PAIR_CREDITS) {
    const ids = await findPairPublicIds(folder, base);

    if (!ids.length) {
      console.warn(
        `No matching assets found for folder=${folder}, base=${base}`
      );
      continue;
    }

    await cloudinary.uploader.add_context(
      {
        artist,
        artist_url: url,
      },
      ids
    );

    console.log("Updated context for:", ids.join(", "));
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});