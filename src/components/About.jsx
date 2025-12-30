// About.jsx
import { Link } from "react-router-dom";
import { Helmet } from "@dr.pogodin/react-helmet";
import SocialLinks from "./SocialLinks";

const SITE = "https://www.matchmadepics.com";

export default function About() {
    const title = "About MatchMade - Matching Profile Pics Site";
    const description =
        "MatchMade is a small site for curated matching profile pics (pfps) for friends, couples and besties. Learn how it works, who made it, and how to use the images.";

    return (
        <div className="about-page">
            <Helmet>
                <title>{title}</title>
                <meta name="description" content={description} />
                <link rel="canonical" href={`${SITE}/about/`} />
                <meta property="og:title" content={title} />
                <meta property="og:description" content={description} />
            </Helmet>

            <h2>About MatchMade</h2>
            <p>
                MatchMade is a small, hand-curated collection of matching profile pics for
                friends, couples and besties. Instead of digging through random boards
                and reposts, everything is organized into pairs you can grab in one place.
            </p>

            <section>
                <h3>What you can do here</h3>
                <ul>
                    <li>Browse matching profile pics by category: Anime, Cartoons, Cute, Games, Movies and LGBTQ.</li>
                    <li>Open any pair to see both sides in a clean, distraction-free viewer.</li>
                    <li>Download the whole pair as a ZIP on desktop, or save left/right images on mobile.</li>
                    <li>Use them on Discord, Instagram, TikTok, Twitter/X, or wherever you hang out online.</li>
                </ul>
            </section>

            <section>
                <h3>How MatchMade works</h3>
                <ul>
                    <li>No account required and no paywall, just browse and download.</li>
                    <li>
                        Images are optimized so they load fast while keeping good quality,
                        especially on mobile.
                    </li>
                    <li>
                        New matching profile pics are added over time in different themes and
                        categories.
                    </li>
                </ul>
            </section>

            <section>
                <h3>Who's behind this?</h3>
                <p>
                    MatchMade was created by a CS student and web developer who loves cozy,
                    user centric design and wanted an easier way to find
                    matching profile pics for friends and couples. It's a
                    personal side project, not a big company so feedback and suggestions
                    really help shape what gets added next.
                </p>
            </section>

            <section>
                <h3>What are matching pfps?</h3>
                <p>
                    Matching profile pictures (pfps) are two images that complement each other,
                    often featuring the same character or theme but with different poses or expressions.
                    They're used by friends, couples, and besties to show their connection and share a common aesthetic.
                </p>
            </section>

            <section>
                <h3>Image usage & credit</h3>
                <ul>
                    <li>All pairs are intended for personal use as avatars / profile pictures.</li>
                    <li>
                        Please don't resell or claim the artwork as your own. If you share it,
                        linking back to MatchMade or the artist is appreciated.
                    </li>
                    <li>
                        If you're an artist and want credit added, a correction, or removal,
                        you can reach out and it will be handled as quickly as possible.
                    </li>
                </ul>
            </section>

            <section>
                <h3>Questions or ideas?</h3>
                <p>
                    Got a character, ship or vibe you'd love to see as a matching pair?
                    Feel free to reach out on my socials or support me on kofi, it helps keep the site running.

                    You can also return to the <span><Link to="/">homepage</Link></span> to start browsing pairs.
                </p>
                <SocialLinks />
            </section>
        </div>
    );
}
