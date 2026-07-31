import IconFacebook from "./icons/IconFacebook";
import IconGlobe from "./icons/IconGlobe";
import IconInstagram from "./icons/IconInstagram";
import IconTikTok from "./icons/IconTikTok";
import IconTwitter from "./icons/IconTwitter";

import Card from "./Card";

const socialClass =
  "transition-[color,transform,scale] hover:scale-125 focus:scale-125 hover:text-accent focus:text-accent";

interface WelcomeProps {
  className?: string;
}

export default function Welcome(props: WelcomeProps) {
  const { className } = props;

  return (
    <Card className={className} title="Welcome to e.l.f.">
      <p className="mt-2 mb-4">
        e.l.f. Cosmetics makes the best of beauty accessible to every eye, lip,
        and face. We are 100% vegan, cruelty-free, and Fair Trade Certified,
        because kindness is chic. Explore our Twitch exclusive showcase to find
        your new favorites.
      </p>

      <p className="mb-6 text-center text-[10px] font-medium opacity-60">
        Special thanks to{" "}
        <a
          href="https://www.alveussanctuary.org/"
          rel="noreferrer"
          target="_blank"
          className="underline transition-colors hover:text-highlight"
        >
          Alveus Sanctuary
        </a>{" "}
        for the open-source extension this project is built upon.
      </p>

      <ul className="mb-2 flex flex-wrap items-center justify-center gap-4">
        <li className={socialClass}>
          <a
            href="https://go.elfcosmetics.com/homepage"
            rel="noreferrer"
            target="_blank"
            title="Website"
          >
            <IconGlobe size={32} />
          </a>
        </li>
        <li className={socialClass}>
          <a
            href="https://www.instagram.com/elfcosmetics"
            rel="noreferrer"
            target="_blank"
            title="Instagram"
          >
            <IconInstagram size={32} />
          </a>
        </li>
        <li className={socialClass}>
          <a
            href="https://www.tiktok.com/@elfyeah"
            rel="noreferrer"
            target="_blank"
            title="TikTok"
          >
            <IconTikTok size={32} />
          </a>
        </li>
        <li className={socialClass}>
          <a
            href="https://x.com/elfcosmetics"
            rel="noreferrer"
            target="_blank"
            title="X (Twitter)"
          >
            <IconTwitter size={32} />
          </a>
        </li>
        <li className={socialClass}>
          <a
            href="https://www.facebook.com/elfcosmetics"
            rel="noreferrer"
            target="_blank"
            title="Facebook"
          >
            <IconFacebook size={32} />
          </a>
        </li>
      </ul>
    </Card>
  );
}
