import React, { useRef, useEffect, useState } from 'react';

interface TransparentSpriteProps {
    src: string;
    className?: string;
    alt?: string;
}

export const TransparentSprite: React.FC<TransparentSpriteProps> = ({ src, className, alt }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = src;

        img.onload = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) return;

            // Set canvas resolution to match image natively
            canvas.width = img.width;
            canvas.height = img.height;

            // Draw image to canvas
            ctx.drawImage(img, 0, 0);

            // Read pixels and make near-white pixels transparent
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                // If the pixel is very light (nearly white background)
                if (r > 240 && g > 240 && b > 240) {
                    data[i + 3] = 0; // Set alpha to 0
                }
            }

            ctx.putImageData(imageData, 0, 0);
            setIsLoaded(true);
        };
    }, [src]);

    return (
        <canvas 
            ref={canvasRef} 
            className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`} 
            aria-label={alt}
        />
    );
};
