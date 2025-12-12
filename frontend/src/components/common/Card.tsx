import Link from 'next/link';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
}

export function Card({ children, className = '', hover = false }: CardProps) {
    return (
        <div className={`bg-white rounded-2xl shadow-md p-6 ${hover ? 'transition-all duration-300 hover:shadow-xl hover:-translate-y-1' : ''} ${className}`}>
            {children}
        </div>
    );
}

interface ToolCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    href: string;
    color?: string;
}

export function ToolCard({ title, description, icon, href, color = 'indigo' }: ToolCardProps) {
    const colorClasses: Record<string, string> = {
        indigo: 'bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white',
        purple: 'bg-purple-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white',
        blue: 'bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white',
        green: 'bg-green-100 text-green-600 group-hover:bg-green-600 group-hover:text-white',
    };

    return (
        <Link href={href} className="group block">
            <div className="bg-white rounded-2xl shadow-md p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border border-gray-100">
                <div className={`w-14 h-14 rounded-xl ${colorClasses[color]} flex items-center justify-center mb-6 transition-all duration-300`}>
                    {icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors">
                    {title}
                </h3>
                <p className="text-gray-500 leading-relaxed">
                    {description}
                </p>
                <div className="mt-6 flex items-center gap-2 text-indigo-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Try now
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                </div>
            </div>
        </Link>
    );
}

interface StepCardProps {
    step: number;
    title: string;
    description: string;
}

export function StepCard({ step, title, description }: StepCardProps) {
    return (
        <div className="text-center group">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg group-hover:scale-110 transition-transform">
                {step}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
            <p className="text-gray-500">{description}</p>
        </div>
    );
}
