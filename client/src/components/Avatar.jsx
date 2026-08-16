import { User } from 'lucide-react';

export default function Avatar({ member, size = 32, className = "" }) {
  if (!member) return <User size={size * 0.6} className={className} />;

  if (member.photoURL) {
    return (
      <img 
        src={member.photoURL} 
        alt={member.name || "Member"} 
        width={size} 
        height={size} 
        className={`rounded-full object-cover ${className}`} 
        style={{ width: size, height: size }}
      />
    );
  }

  if (member.name) {
    const initials = member.name.substring(0, 2).toUpperCase();
    return (
      <div 
        className={`flex items-center justify-center bg-primary/10 text-primary font-medium rounded-full ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {initials}
      </div>
    );
  }

  return (
    <div 
      className={`flex items-center justify-center bg-highlight rounded-full text-text-muted ${className}`}
      style={{ width: size, height: size }}
    >
      <User size={size * 0.6} />
    </div>
  );
}
