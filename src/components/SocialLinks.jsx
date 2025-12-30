const SOCIAL_LINKS = [
    {
        key: "instagram",
        label: "Instagram",
        href: "https://www.instagram.com/matchmadepics",
        icon: (
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm0 2a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H7zm11.25 1.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0zM12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm0 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
            </svg>
        ),
    },
    {
        key: "tiktok",
        label: "TikTok",
        href: "https://www.tiktok.com/@matchmadepics.com",
        icon: (
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M16 3.5v2.4a4.6 4.6 0 0 0 3.1 1.2v2.6a6.6 6.6 0 0 1-3.1-.75v5.35a5.75 5.75 0 1 1-5.75-5.75c.21 0 .42.01.63.04v2.65a2.75 2.75 0 1 0 2.25 2.7V3.5H16z" />
            </svg>
        ),
    },
    {
        key: "kofi",
        label: "Buy me a hot cocoa",
        href: "https://ko-fi.com/A0A51PGK4M",
        icon: (
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 7.422-2.831 6.649-6.916zm-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09-.443-.441-3.368-3.049-4.034-3.954-.709-.965-1.041-2.7-.091-3.71.951-1.01 3.005-1.086 4.363.407 0 0 1.565-1.782 3.468-.963 1.904.82 1.832 3.011.723 4.311zm6.173.478c-.928.116-1.682.028-1.682.028V7.284h1.77s1.971.551 1.971 2.638c0 1.913-.985 2.667-2.059 3.015z" />
            </svg>
        ),
    },
];

export default function SocialLinks() {
    return (
        <div className="social-links" aria-label="MatchMade social profiles">
          {SOCIAL_LINKS.map((link) => (
            <a
              key={link.key}
              className="social-button"
              href={link.href}
              target="_blank"
              rel="noreferrer noopener"
            >
              {link.icon}
              <span>{link.label}</span>
            </a>
          ))}
        </div>
    );
}