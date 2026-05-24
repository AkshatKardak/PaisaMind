const sizes = {
  text: "h-4 w-full rounded-full",
  card: "h-36 w-full rounded-2xl",
  chart: "h-64 w-full rounded-2xl",
  avatar: "h-12 w-12 rounded-full",
};

function SkeletonLoader({ variant = "text" }) {
  return <div className={`shimmer ${sizes[variant] || sizes.text}`} />;
}

export default SkeletonLoader;
