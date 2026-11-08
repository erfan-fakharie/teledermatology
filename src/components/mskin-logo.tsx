import Image from "next/image";

export default function MskinLogo({ height = 36, variant = "horizontal", tone = "auto", decorative = false }: {
  height?: number;
  variant?: "horizontal" | "mark" | "stacked";
  tone?: "dark" | "light" | "auto";
  decorative?: boolean;
}) {
  if (tone === "auto") return <span className="brand-adaptive">
    <span className="brand-on-light"><MskinLogo height={height} variant={variant} tone="dark" decorative={decorative}/></span>
    <span className="brand-on-dark"><MskinLogo height={height} variant={variant} tone="light" decorative={decorative}/></span>
  </span>;
  const [width, viewHeight] = variant === "horizontal" ? [244, 72] : variant === "stacked" ? [160, 158] : [72, 72];
  const src = variant === "horizontal"
    ? (tone === "dark" ? "/mskin-logo.svg" : "/brand/mskin-logo-light.svg")
    : `/brand/mskin-${variant}-${tone}.svg`;

  return <Image
    src={src}
    alt={decorative ? "" : "mskin"}
    aria-hidden={decorative || undefined}
    width={Math.round(height * width / viewHeight)}
    height={height}
    style={{ height, width: "auto", flexShrink: 0 }}
    draggable={false}
    data-brand-logo={variant}
    unoptimized
  />;
}
