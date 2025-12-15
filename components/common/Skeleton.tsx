import React from 'react';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'rectangular' | 'circular';
    width?: string | number;
    height?: string | number;
}

const Skeleton: React.FC<SkeletonProps> = ({
    className = "",
    variant = "rectangular",
    width,
    height
}) => {
    const baseClasses = "animate-pulse bg-gray-300 dark:bg-gray-700";
    const variantClasses = {
        text: "rounded",
        rectangular: "rounded-md",
        circular: "rounded-full"
    };

    const style = {
        width: width,
        height: height
    };

    return (
        <div
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            style={style}
        />
    );
};

export default Skeleton;
