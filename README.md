# MatchMade

Matching profile pictures for friends, couples, and special connections.

**MatchMade** is a web app that curates and delivers matching profile pictures (PFPs) for friends, couples, and communities.

The site sources images from Cloudinary and organizes them into categories like Anime, Cartoons, Cute, and LGBTQ.
Users can browse pairs, view them in a modal, and save them in one click. Making it easy to coordinate profile pics with someone special.

## Features

📂 **Dynamic Cloudinary Integration:?** Images are pulled and paired automatically from Cloudinary folders.

🖼 **Image Pairs:** Every PFP set comes in left/right pairs.

📱 **Responsive Grid:** Balanced three-column layout with skeleton loaders.

🔍 **Pagination:** 6 pairs per page for faster browsing.

🎨 **Modal Preview:** Enlarged view with both images side-by-side.

⚡ **Static JSON Generation:** A Node.js build script fetches Cloudinary assets and generates static pairs-<category>.json files for GitHub Pages hosting.

## Tech Stack

- **Frontend:** React 19, React Router 7, Vite

- **Styling:** Bootstrap 5 + custom CSS

- **Hosting:** GitHub Pages (custom domain at matchmadepics.com)

- **Media:** Cloudinary (image storage, transformations, overlays)

- **Automation:** GitHub Actions (CI/CD, JSON regeneration)