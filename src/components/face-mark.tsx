export default function FaceMark({ size = 24 }: { size?: number }) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-block",
        flex: "0 0 auto",
        width: size,
        height: size,
        backgroundColor: "currentColor",
        mask: "url('/face-mark.svg') center / contain no-repeat",
      }}
    />
  );
}
