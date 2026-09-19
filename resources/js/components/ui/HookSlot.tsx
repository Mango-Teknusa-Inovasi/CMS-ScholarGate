import React from 'react';
import { usePage } from '@inertiajs/react';

interface HookSlotProps {
    name: string;
    className?: string;
}

export const HookSlot: React.FC<HookSlotProps> = ({ name, className = '' }) => {
    const { props } = usePage<{ hooks?: Record<string, (string | Record<string, unknown>)[]> }>();
    const registered = props.hooks?.[name] || [];

    if (!registered || registered.length === 0) {
        return null;
    }

    return (
        <div className={`hook-slot hook-slot-${name} ${className}`}>
            {registered.map((item, index) => {
                if (typeof item === 'string') {
                    return (
                        <div
                            key={index}
                            className="hook-widget-item"
                            dangerouslySetInnerHTML={{ __html: item }}
                        />
                    );
                }
                return null;
            })}
        </div>
    );
};

export default HookSlot;
