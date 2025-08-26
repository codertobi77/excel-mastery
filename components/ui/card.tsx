import React from 'react';

// Shadcn-style Card primitives (named exports)
export function Card({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`} {...props} />
}

export function CardHeader({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props} />
}

export function CardTitle({ className = '', ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`} {...props} />
}

export function CardDescription({ className = '', ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={`text-sm text-muted-foreground ${className}`} {...props} />
}

export function CardContent({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`p-6 pt-0 ${className}`} {...props} />
}

export function CardFooter({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`flex items-center p-6 pt-0 ${className}`} {...props} />
}

// Keep backwards-compatible default export used by courses page
interface CourseCardProps {
  title: string;
  description: string;
}

const CourseCard: React.FC<CourseCardProps> = ({ title, description }) => {
  return (
    <div className="p-4 border rounded-lg bg-card">
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="text-muted-foreground">{description}</p>
      <button className="mt-2">Voir le cours</button>
    </div>
  );
};

export default CourseCard;
