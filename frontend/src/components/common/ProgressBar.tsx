interface ProgressBarProps {
    progress: number; // 0-100
    showLabel?: boolean;
    size?: 'sm' | 'md' | 'lg';
    color?: 'indigo' | 'green' | 'blue';
}

export default function ProgressBar({
    progress,
    showLabel = true,
    size = 'md',
    color = 'indigo',
}: ProgressBarProps) {
    const sizeClasses = {
        sm: 'h-1.5',
        md: 'h-2.5',
        lg: 'h-4',
    };

    const colorClasses = {
        indigo: 'from-indigo-500 to-purple-600',
        green: 'from-green-500 to-emerald-600',
        blue: 'from-blue-500 to-cyan-600',
    };

    const clampedProgress = Math.min(100, Math.max(0, progress));

    return (
        <div className="w-full">
            {showLabel && (
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Progress</span>
                    <span className="text-sm font-semibold text-gray-900">{Math.round(clampedProgress)}%</span>
                </div>
            )}
            <div className={`w-full ${sizeClasses[size]} bg-gray-200 rounded-full overflow-hidden`}>
                <div
                    className={`h-full bg-gradient-to-r ${colorClasses[color]} rounded-full transition-all duration-300 ease-out`}
                    style={{ width: `${clampedProgress}%` }}
                />
            </div>
        </div>
    );
}
