export default function Logo({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 22C6 22 10 18 16 18C22 18 26 22 26 22" stroke="#105D5E" strokeWidth="2.5" strokeLinecap="round" opacity="0.35" />
      <path d="M4 17C4 17 9 12 16 12C23 12 28 17 28 17" stroke="#105D5E" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
      <path d="M2 12C2 12 8 6 16 6C24 6 30 12 30 12" stroke="#105D5E" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
