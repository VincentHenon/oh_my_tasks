import { X } from 'lucide-react';
import { useState } from 'react';

const CrossIcon = ({ 
    size = 16, 
    className = '', 
    onClick = () => {}, 
    ...props 
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const [animationClass, setAnimationClass] = useState('');

    const handleMouseEnter = () => {
        setIsHovered(true);
        setAnimationClass('animate-[closing_0.3s_ease-in-out]');
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        setAnimationClass('animate-[closing-reverse_0.3s_ease-in-out]');
        // Réinitialiser la classe après l'animation
        setTimeout(() => {
            setAnimationClass('');
        }, 300);
    };

    return (
        <X 
            size={size}
            className={`cursor-pointer transition-colors duration-300 ${animationClass} ${isHovered ? 'text-white' : ''} ${className}`}
            onClick={onClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            {...props}
        />
    );
};

export default CrossIcon;