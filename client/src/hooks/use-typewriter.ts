import { useState, useEffect, useRef } from "react";

export function useTypewriter(content: string, speed: number = 20, animate: boolean = true) {
    const [displayText, setDisplayText] = useState(animate ? "" : content);
    const [isFinished, setIsFinished] = useState(!animate);
    const contentRef = useRef(content);
    const indexRef = useRef(animate ? 0 : content.length);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        contentRef.current = content;
        if (!animate) {
            setDisplayText(content);
            setIsFinished(true);
            indexRef.current = content.length;
            return;
        }

        // If we were finished but more content arrived (streaming)
        if (isFinished && indexRef.current < content.length) {
            setIsFinished(false);
        }
    }, [content, animate]);

    useEffect(() => {
        if (!animate || isFinished) return;

        const tick = () => {
            if (indexRef.current < contentRef.current.length) {
                // Dynamic speed adjustment: "chase" if we're far behind
                const charsBehind = contentRef.current.length - indexRef.current;
                let increment = 1;
                let currentSpeed = speed;

                if (charsBehind > 100) {
                    increment = 4;
                    currentSpeed = speed / 4;
                } else if (charsBehind > 50) {
                    increment = 2;
                    currentSpeed = speed / 2;
                }

                indexRef.current = Math.min(indexRef.current + increment, contentRef.current.length);
                setDisplayText(contentRef.current.slice(0, indexRef.current));
                timerRef.current = setTimeout(tick, currentSpeed);
            } else {
                setIsFinished(true);
            }
        };

        timerRef.current = setTimeout(tick, speed);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [animate, isFinished, speed]);

    return { displayText, isFinished };
}
