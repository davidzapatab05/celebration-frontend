import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { motion } from 'framer-motion';

interface MovingButtonProps {
    onTryClick: () => void;
    containerRef: React.RefObject<HTMLDivElement | null>;
    style?: React.CSSProperties;
    className?: string;
}

export function MovingButton({ onTryClick, containerRef, style, className }: MovingButtonProps) {
    // We use 'undefined' initially to let CSS classes handle the start position
    const [targetPos, setTargetPos] = useState<{ top: number; left: number } | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const moveButton = () => {
        if (!wrapperRef.current || !containerRef.current) return;

        // Use clientWidth/Height for accurate inner dimensions (padding box) which absolute positioning uses
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;

        const buttonRect = wrapperRef.current.getBoundingClientRect();
        const buttonWidth = buttonRect.width;
        const buttonHeight = buttonRect.height;

        // Calculate safe boundaries: 0 to (Container - Button)
        const padding = 20; // Safe distance from edges

        // Ensure we don't get negative values if container is too small
        const maxLeft = Math.max(0, containerWidth - buttonWidth - padding);
        const maxTop = Math.max(0, containerHeight - buttonHeight - padding);

        // Exclusion zone (Yes button center)
        const centerX = containerWidth / 2;
        const centerY = containerHeight / 2;
        // Assume Yes button + buffer is roughly 250x100
        const exclusionWidth = 280;
        const exclusionHeight = 100;

        const exclusionRect = {
            left: centerX - exclusionWidth / 2,
            right: centerX + exclusionWidth / 2,
            top: centerY - exclusionHeight / 2,
            bottom: centerY + exclusionHeight / 2
        };

        let newLeft = 0;
        let newTop = 0;
        let overlap = true;
        let attempts = 0;
        const maxAttempts = 50;

        while (overlap && attempts < maxAttempts) {
            // Random position within safe zone (padding ... max-padding)
            // We adding padding/2 to start from slightly inside
            newLeft = (Math.random() * maxLeft) + (padding / 2);
            newTop = (Math.random() * maxTop) + (padding / 2);

            const thisRect = {
                left: newLeft,
                right: newLeft + buttonWidth,
                top: newTop,
                bottom: newTop + buttonHeight
            };

            const isOverlapping = !(
                thisRect.left > exclusionRect.right ||
                thisRect.right < exclusionRect.left ||
                thisRect.top > exclusionRect.bottom ||
                thisRect.bottom < exclusionRect.top
            );

            if (!isOverlapping) {
                overlap = false;
            }
            attempts++;
        }

        // Fallback: If we couldn't find a spot (overlap is still true), force it to a safe corner
        if (overlap) {
            // Pick a random corner
            const corners = [
                { left: padding, top: padding }, // Top-Left
                { left: maxLeft, top: padding }, // Top-Right
                { left: padding, top: maxTop },  // Bottom-Left
                { left: maxLeft, top: maxTop }   // Bottom-Right
            ];
            const randomCorner = corners[Math.floor(Math.random() * corners.length)];
            newLeft = randomCorner.left;
            newTop = randomCorner.top;
        }

        setTargetPos({ top: newTop, left: newLeft });
        onTryClick();
    };

    const handleInteraction = () => {
        moveButton();
    };

    return (
        <motion.div
            ref={wrapperRef}
            // If we have a targetPos, animate to it. 
            animate={targetPos ? { top: targetPos.top, left: targetPos.left } : {}}
            transition={{
                type: 'spring',
                stiffness: 800,
                damping: 25
            }}
            // Apply initial CSS classes (bottom-10 etc) only if we haven't moved yet.
            className={`absolute z-50 pointer-events-auto ${!targetPos ? (className || '') : ''}`}
            // Remove transform explicitly just in case.
            style={targetPos ? { transform: 'none' } : {}}
        >
            <div
                onMouseEnter={handleInteraction}
                onTouchStart={handleInteraction}
                className="inline-block"
            >
                <Button
                    variant="secondary"
                    className="border border-purple-200 text-purple-500 hover:text-purple-600 hover:bg-purple-50"
                    style={style}
                >
                    No 💔
                </Button>
            </div>
        </motion.div>
    );
}
