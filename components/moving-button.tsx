import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { motion } from 'framer-motion';

interface MovingButtonProps {
    onTryClick: () => void;
    containerRef: React.RefObject<HTMLDivElement | null>;
    style?: React.CSSProperties;
    className?: string;
}

export function MovingButton({ onTryClick, containerRef, style, className }: MovingButtonProps) {
    const [targetPos, setTargetPos] = useState<{ top: number; left: number } | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const lastMousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const isMoving = useRef(false);

    const moveButton = useCallback(() => {
        if (!wrapperRef.current || !containerRef.current || isMoving.current) return;

        isMoving.current = true;

        const containerRect = containerRef.current.getBoundingClientRect();
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;

        const buttonRect = wrapperRef.current.getBoundingClientRect();
        const buttonWidth = buttonRect.width;
        const buttonHeight = buttonRect.height;

        const padding = 24;
        const maxLeft = Math.max(0, containerWidth - buttonWidth - padding);
        const maxTop = Math.max(0, containerHeight - buttonHeight - padding);

        // Exclusion zone for 'Yes' button (assuming it's centered)
        const centerX = containerWidth / 2;
        const centerY = containerHeight / 2;
        const exclusionWidth = 240;
        const exclusionHeight = 100;

        const exclusionRect = {
            left: centerX - exclusionWidth / 2,
            right: centerX + exclusionWidth / 2,
            top: centerY - exclusionHeight / 2,
            bottom: centerY + exclusionHeight / 2
        };

        // Current cursor position relative to container
        const cursorX = lastMousePos.current.x - containerRect.left;
        const cursorY = lastMousePos.current.y - containerRect.top;
        const minDistanceFromCursor = 180; // Safety perimeter

        let newLeft = 0;
        let newTop = 0;
        let overlap = true;
        let attempts = 0;
        const maxAttempts = 100;

        while (overlap && attempts < maxAttempts) {
            newLeft = (Math.random() * maxLeft) + (padding / 2);
            newTop = (Math.random() * maxTop) + (padding / 2);

            const thisRect = {
                left: newLeft,
                right: newLeft + buttonWidth,
                top: newTop,
                bottom: newTop + buttonHeight
            };

            const isOverlappingYes = !(
                thisRect.left > exclusionRect.right ||
                thisRect.right < exclusionRect.left ||
                thisRect.top > exclusionRect.bottom ||
                thisRect.bottom < exclusionRect.top
            );

            const buttonCenterX = newLeft + buttonWidth / 2;
            const buttonCenterY = newTop + buttonHeight / 2;
            const distanceFromCursor = Math.sqrt(
                Math.pow(buttonCenterX - cursorX, 2) +
                Math.pow(buttonCenterY - cursorY, 2)
            );

            if (!isOverlappingYes && distanceFromCursor >= minDistanceFromCursor) {
                overlap = false;
            }
            attempts++;
        }

        if (overlap) {
            // Find the corner farthest from the cursor if random failed
            const corners = [
                { left: padding, top: padding },
                { left: maxLeft, top: padding },
                { left: padding, top: maxTop },
                { left: maxLeft, top: maxTop }
            ];

            let maxDist = -1;
            corners.forEach(corner => {
                const dist = Math.sqrt(
                    Math.pow(corner.left - cursorX, 2) +
                    Math.pow(corner.top - cursorY, 2)
                );
                if (dist > maxDist) {
                    maxDist = dist;
                    newLeft = corner.left;
                    newTop = corner.top;
                }
            });
        }

        setTargetPos({ top: newTop, left: newLeft });
        onTryClick();

        // Anti-throttle to prevent flickering
        setTimeout(() => {
            isMoving.current = false;
        }, 300);
    }, [containerRef, onTryClick]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            lastMousePos.current = { x: e.clientX, y: e.clientY };

            if (!wrapperRef.current || !containerRef.current || isMoving.current) return;

            const rect = wrapperRef.current.getBoundingClientRect();
            const btnCenterX = rect.left + rect.width / 2;
            const btnCenterY = rect.top + rect.height / 2;

            const distance = Math.sqrt(
                Math.pow(btnCenterX - e.clientX, 2) +
                Math.pow(btnCenterY - e.clientY, 2)
            );

            // If cursor gets too close (120px perimeter), escape!
            if (distance < 120) {
                moveButton();
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [moveButton]);

    const handleTouch = (e: React.TouchEvent) => {
        if (e.touches && e.touches[0]) {
            lastMousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            moveButton();
        }
    };

    return (
        <motion.div
            ref={wrapperRef}
            animate={targetPos ? { top: targetPos.top, left: targetPos.left } : {}}
            transition={{
                type: 'spring',
                stiffness: 250,
                damping: 30
            }}
            className={`${targetPos ? 'absolute top-0 left-0' : 'relative'} z-50 pointer-events-auto ${!targetPos ? (className || '') : ''}`}
            style={targetPos ? { transform: 'none' } : {}}
        >
            <div
                onMouseEnter={() => moveButton()}
                onTouchStart={handleTouch}
                className="inline-block p-4" // Reasonable padding for hit area
            >
                <Button
                    variant="outline"
                    className="border border-purple-200 text-purple-500 hover:text-purple-600 hover:bg-purple-50 bg-white min-w-[100px] h-11 rounded-xl shadow-sm"
                    style={style}
                >
                    No 💔
                </Button>
            </div>
        </motion.div>
    );
}
