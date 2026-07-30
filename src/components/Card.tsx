import { classes } from "../utils/classes";

import Ring from "./Ring";

import logo from "../assets/logo.png";

interface CardProps {
  children?: React.ReactNode;
  title?: string;
  className?: string;
}

export default function Card(props: CardProps) {
  const { children, title, className } = props;

  return (
    <div
      className={classes(
        "scrollbar-thin flex max-h-full w-[32rem] max-w-full flex-col items-center justify-between overflow-y-auto rounded-3xl bg-[#454bc5] p-5 shadow-sm scrollbar-thumb-white/20 scrollbar-track-transparent",
        !/\b(static|sticky|fixed|absolute)\b/.test(className || "") &&
          "relative",
        className,
      )}
    >
      {title && (
  <h2 className="mb-2 flex flex-col items-center justify-center gap-2 text-center font-sans text-3xl font-black text-balance text-[#9af4cb]" tracking-wider>
    <img
      src={logo}
      alt="Logo"
      className="h-20 w-20 object-contain"
    />
    {title}
  </h2>
)}
      {children}

      <Ring className="rounded-3xl" />
    </div>
  );
}
