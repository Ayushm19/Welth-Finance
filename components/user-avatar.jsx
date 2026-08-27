export default function UserAvatar({
  name,
  imageUrl,
  size = 40,
  className = "",
}) {
  const initial = (name || "?").charAt(0).toUpperCase();
  const dim = typeof size === "number" ? `${size}px` : size;

  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={name || "User"}
        width={typeof size === "number" ? size : undefined}
        height={typeof size === "number" ? size : undefined}
        className={`rounded-full object-cover shrink-0 ${className}`}
        style={{ width: dim, height: dim }}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <div
      className={`rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold shrink-0 ${className}`}
      style={{ width: dim, height: dim, fontSize: Math.max(10, size * 0.35) }}
      aria-hidden
    >
      {initial}
    </div>
  );
}
