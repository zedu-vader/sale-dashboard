// Avatars, Zedu Design System §7.7.

const PAIRS = [
  ["#ede8ff", "#4b2bd6"],
  ["#e3f8ec", "#0b8a50"],
  ["#ffe6ea", "#d0284a"],
  ["#e1f0ff", "#1a6fd1"],
  ["#fff1e0", "#c46a0a"],
] as const;

export function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

type Props = {
  name: string;
  size?: 28 | 34 | 36 | 38 | 48;
  image?: string | null;
  /** The signed-in user: solid brand with white text. */
  self?: boolean;
  className?: string;
};

export function Avatar({ name, size = 34, image, self, className = "" }: Props) {
  const style = { width: size, height: size, fontSize: Math.round(size * 0.36) };

  if (image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={image} alt="" referrerPolicy="no-referrer" className={`shrink-0 rounded-full object-cover ${className}`} style={style} />;
  }

  const [bg, fg] = self ? ["var(--brand)", "#fff"] : PAIRS[hash(name) % PAIRS.length];
  return (
    <span
      aria-hidden
      className={`inline-grid shrink-0 place-items-center rounded-full font-bold ${className}`}
      style={{ ...style, background: bg, color: fg }}
    >
      {initials(name)}
    </span>
  );
}
