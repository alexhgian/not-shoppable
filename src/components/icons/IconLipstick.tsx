import { type FC } from "react";

interface IconProps {
  size?: number;
  className?: string;
}

const IconLipstick: FC<IconProps> = ({ size = 24, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M9 12V5c0-1.1.9-2 2-2h1l3 4v5Z" />
    <rect width="10" height="12" x="7" y="12" rx="2" />
  </svg>
);

export default IconLipstick;