import { cn } from '../../lib/utils';

interface SpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const sizeMap = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
};

export function Spinner({ size = 'md', className }: SpinnerProps) {
    return (
        <div
            role="status"
            aria-label="Loading"
            className={cn(
                'animate-spin rounded-full border-[var(--color-creator-purple)]/30 border-t-[var(--color-creator-purple)]',
                sizeMap[size],
                className,
            )}
        />
    );
}

export function PageSpinner() {
    return (
        <div className="flex min-h-[50vh] items-center justify-center">
            <Spinner size="lg" />
        </div>
    );
}
