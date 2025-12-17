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
    folder: "games",
    base: "Kanade_Honami",
    artist: "Enskkt",
    url: "https://qwew0225.wixsite.com/wakaportfolio",
  },
  {
    folder: "games",
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
  {
    folder: "anime",
    base: "Oreki_Chitanda",
    artist: "MINYU",
    url: "https://lit.link/en/AyellowDog",
  },
  {
    folder: "anime",
    base: "Fukube_Ibara",
    artist: "MINYU",
    url: "https://lit.link/en/AyellowDog",
  },
  {
    folder: "anime",
    base: "holidaysweets",
    artist: "妖怪春歌",
    url: "https://www.pixiv.net/en/users/33177449",
  },
  {
    folder: "anime",
    base: "chibi_momo_okarun",
    artist: "Tv in Bath",
    url: "https://x.com/Tv_in_Bath",
  },
   {
    folder: "games",
    base: "akitoya",
    artist: "LThenray",
    url: "https://x.com/LThenray",
  },
  {
    folder: "games",
    base: "emukasa",
    artist: "edamameekaki on twitter",
    url: "https://x.com/edamameekaki",
  },
   {
    folder: "games",
    base: "k-kula",
    artist: "hirup1464",
    url: "https://x.com/hirup1464",
  },
   {
    folder: "anime",
    base: "Obanai_Mitsuri",
    artist: "ChihoIshi",
    url: "https://potofu.me/chihoishi",
  },
  {
    folder: "anime",
    base: "Denji_Reze",
    artist: "Starless Night",
    url: "https://www.facebook.com/profile.php?id=61562240311408",
  },
   {
    folder: "anime",
    base: "Kanae_Mitsuri",
    artist: "Starless Night",
    url: "https://www.facebook.com/profile.php?id=61562240311408",
  },
  {
    folder: "anime",
    base: "nagi-reo-candy",
    artist: "doran",
    url: "https://x.com/ddd1doran",
  },
   {
    folder: "anime",
    base: "nagi-reo-hat",
    artist: "doran",
    url: "https://x.com/ddd1doran",
  },
  //  {
  //   folder: "anime",
  //   base: "tokyo noise",
  //   artist: "ChihoIshi",
  //   url: "https://potofu.me/chihoishi",
  // },
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