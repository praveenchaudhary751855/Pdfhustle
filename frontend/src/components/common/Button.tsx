interface ButtonProps {
    children: React.ReactNode;
    variant?: 'primary' | 'ghost' | 'outline';
    size?: 'default' | 'large' | 'small';
    disabled?: boolean;
    loading?: boolean;
    onClick?: () => void;
    type?: 'button' | 'submit';
    className?: string;
}

export default function Button({
    children,
    variant = 'primary',
    size = 'default',
    disabled = false,
    loading = false,
    onClick,
    type = 'button',
    className = '',
}: ButtonProps) {
    const baseStyles = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
        primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm hover:shadow-md',
        ghost: 'bg-transparent text-gray-900 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50',
        outline: 'bg-transparent text-indigo-600 border-2 border-indigo-600 hover:bg-indigo-50',
    };

    const sizes = {
        small: 'px-4 py-2 text-sm',
        default: 'px-6 py-3 text-sm',
        large: 'px-8 py-4 text-base',
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        >
            {loading && (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
            )}
            {children}
        </button>
    );
}
