// The repo owner's GitHub avatar: a real, recognisable mark for every tool.
export default function Avatar({ fullName, size = 40 }: { fullName: string; size?: number }) {
  const owner = fullName.split("/")[0];
  return (
    // eslint-disable-next-line @next/next/no-img-element -- tiny remote avatar; next/image would need remote config for little gain
    <img
      src={`https://avatars.githubusercontent.com/${owner}?s=${size * 2}`}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      draggable={false}
      className="shrink-0 rounded-xl border border-line-strong bg-raised"
      style={{ width: size, height: size }}
    />
  );
}
