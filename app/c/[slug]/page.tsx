'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Stars, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MovingButton } from '@/components/moving-button';
import { Great_Vibes } from 'next/font/google';
import { getOptimizedImageUrl } from '@/lib/image-utils';

const greatVibes = Great_Vibes({
    weight: '400',
    subsets: ['latin'],
    variable: '--font-great-vibes',
});

interface Occasion {
    id: string;
    name: string;
    slug: string;
    icon: string;
    primaryColor: string;
    secondaryColor: string;
    description: string;
}

interface CelebrationData {
    partnerName: string;
    message?: string;
    response?: string;
    affectionLevel?: string;
    imagePath?: string;
    user: {
        name: string;
    };
    occasion?: Occasion;
    extraData?: {
        aniversarioType?: 'anios' | 'meses' | 'mixed';
        aniversarioValue?: string;
        customName?: string;
        isAnonymous?: boolean;
    };
}

function FloatingHeart({ color }: { color: string }) {
    const [randomValues] = useState(() => ({
        left: Math.random() * 100,
        duration: 10 + Math.random() * 20,
        delay: Math.random() * 5,
        scale: 0.8 + Math.random() * 2.0 // Increased size (was 0.5 + ... * 1.5)
    }));

    return (
        <motion.div
            initial={{ y: '110vh', x: `${randomValues.left}vw`, opacity: 0, scale: 0 }}
            animate={{
                y: '-20vh',
                opacity: [0, 0.4, 0.4, 0],
                scale: randomValues.scale
            }}
            transition={{
                duration: randomValues.duration,
                repeat: Infinity,
                delay: randomValues.delay,
                ease: "linear"
            }}
            className="absolute pointer-events-none select-none"
            style={{ color }}
        >
            <Heart fill="currentColor" size={48} />
        </motion.div>
    );
}

function PublicViewContent() {
    const { slug } = useParams();
    const [data, setData] = useState<CelebrationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [accepted, setAccepted] = useState(false);
    const [noCount, setNoCount] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const buttonBoxRef = useRef<HTMLDivElement>(null);

    const fetchData = useCallback(async () => {
        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
            const response = await axios.get(`${backendUrl}/celebration/slug/${slug}`);
            setData(response.data);
            if (response.data.response === 'yes') setAccepted(true);
        } catch (error) {
            console.error('Error fetching celebration data', error);
        } finally {
            setLoading(false);
        }
    }, [slug]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleResponse = async (res: 'yes' | 'no') => {
        if (res === 'yes') {
            setAccepted(true);
            try {
                const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
                await axios.patch(`${backendUrl}/celebration/slug/${slug}/response`, { response: 'yes' });
            } catch (error) {
                console.error('Error updating response', error);
            }
        } else {
            setNoCount(prev => prev + 1);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-purple-50">
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    <Heart className="text-purple-500 w-12 h-12" fill="currentColor" />
                </motion.div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 text-center">
                <div className="max-w-md space-y-4">
                    <X className="w-16 h-16 text-red-400 mx-auto" />
                    <h1 className="text-2xl font-bold text-gray-900 font-sans">¡Oops! Invitación no encontrada</h1>
                    <p className="text-gray-500">Este enlace parece no ser válido o ha caducado.</p>
                    <Button variant="outline" onClick={() => window.location.href = '/'}>Página Principal</Button>
                </div>
            </div>
        );
    }

    const primaryColor = data.occasion?.primaryColor || '#9333ea';

    // Helper for Celebration Title
    const getCelebrationTitle = () => {
        if (data.occasion?.slug === 'aniversario' && data.extraData?.aniversarioValue) {
            const { aniversarioType, aniversarioValue } = data.extraData;

            if (aniversarioType === 'mixed') {
                const [y, m] = aniversarioValue.split('|');
                const yearsLabel = parseInt(y) === 1 ? 'año' : 'años';
                const monthsLabel = parseInt(m) === 1 ? 'mes' : 'meses';
                return `¡Felices ${y} ${yearsLabel} y ${m} ${monthsLabel}! 💍`;
            }

            const label = aniversarioType === 'anios' ? (parseInt(aniversarioValue) === 1 ? 'año' : 'años') : (parseInt(aniversarioValue) === 1 ? 'mes' : 'meses');
            return `¡Felices ${aniversarioValue} ${label}! 💍`;
        }
        if (data.occasion?.slug === 'personalizado') {
            return data.extraData?.customName ? `¡Feliz ${data.extraData.customName}! ✨` : "¡Felicidades! ✨";
        }
        if (data.occasion) {
            return `¡Feliz ${data.occasion.name}! 🎉`;
        }
        return "¡Eres la persona más increíble! ✨";
    };

    // Helper for main question
    const getQuestionText = () => {
        if (data.occasion?.slug === 'san-valentin') return "¿Quieres ser mi San Valentín? ❤️";
        if (data.occasion?.slug === 'personalizado' && data.extraData?.customName) {
            return `¿Quieres celebrar ${data.extraData.customName} conmigo? 🥂`;
        }
        if (data.occasion) return `¿Quieres celebrar ${data.occasion.name.toLowerCase()} conmigo? 🥂`;
        return "¿Quieres celebrar conmigo? 🎊";
    };

    return (
        <main
            className={`${greatVibes.variable} min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans`}
            style={{ backgroundColor: `${primaryColor}10` }}
            ref={containerRef}
        >
            {/* Background Decoration */}
            <div className="absolute inset-0 pointer-events-none">
                {Array.from({ length: 15 }).map((_, i) => (
                    <FloatingHeart key={i} color={primaryColor} />
                ))}
            </div>

            <AnimatePresence mode="wait">
                {!accepted ? (
                    <motion.div
                        key="ask"
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.5 } }}
                        className="bg-white/80 backdrop-blur-md rounded-2xl px-3 py-5 md:p-6 shadow-[0_10px_30px_rgba(0,0,0,0.1)] border border-white max-w-lg w-full text-center relative z-10"
                    >
                        {/* Creator Notice */}
                        <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-gray-100 shadow-sm animate-bounce text-xs font-medium text-gray-600">
                            <Stars className="w-3 h-3 text-amber-400" />
                            {data.extraData?.isAnonymous ? 'Alguien especial te envió algo...' : `${data.user.name} te envió algo especial`}
                        </div>

                        <div className="mb-2">
                            <h2 className="text-gray-500 font-medium mb-0.5 flex flex-col items-center justify-center gap-0.5">
                                <span className="text-xs md:text-sm">Hola,</span>
                                <span className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: primaryColor }}>{data.partnerName} ✨</span>
                            </h2>
                            <h1
                                className="text-2xl md:text-3xl lg:text-3xl font-normal mb-1 font-great-vibes leading-tight drop-shadow-sm"
                                style={{ color: primaryColor }}
                            >
                                {getCelebrationTitle()}
                            </h1>
                        </div>

                        {data.imagePath && (
                            <div className="mb-3 relative w-32 h-32 md:w-40 md:h-40 mx-auto rounded-xl overflow-hidden shadow-lg border-2 border-white rotate-1 hover:rotate-0 transition-transform duration-500 bg-white">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={getOptimizedImageUrl(data.imagePath, { width: 800 }) || ''}
                                    alt="Foto compartida"
                                    className="object-contain w-full h-full"
                                />
                            </div>
                        )}

                        <p className="text-base md:text-lg text-gray-800 font-medium mb-4 mx-auto max-w-lg leading-snug drop-shadow-sm font-handwriting">
                            &quot;{data.message || 'Contigo cada momento es especial. Gracias por ser parte de mi vida.'}&quot;
                        </p>

                        <div className="space-y-4">
                            <h3 className="text-lg md:text-xl font-semibold text-gray-800" style={{ color: primaryColor }}>
                                {getQuestionText()}
                            </h3>

                            <div className="h-4 flex items-center justify-center overflow-hidden mb-1">
                                <motion.p
                                    key={noCount}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: noCount > 0 ? 1 : 0, y: 0 }}
                                    className="text-[9px] md:text-[10px] font-bold text-red-500 px-4 whitespace-nowrap"
                                >
                                    {/* Select message based on noCount, cycling if exceeded */}
                                    {(() => {
                                        if (noCount === 0) return "";
                                        const messages = [
                                            "Tal vez te resbaló el dedo... 🤭",
                                            "Seguro estás jugando... ¿verdad? 🥺",
                                            "Mi corazón late más rápido cuando te acercas al Sí... 💓",
                                            "El destino (y este botón) dicen que Sí... ✨",
                                            "No me hagas esto... 😢",
                                            "¡Acepta! No te arrepentirás 😉",
                                            "El 'Sí' se ve más bonito que el 'No' 👀",
                                            "¡Vamos! Di que sí... 🌹",
                                            "¿De verdad me vas a decir que no? 💔",
                                            "Anda, dale al botón rosa... 💖"
                                        ];
                                        return messages[(noCount - 1) % messages.length];
                                    })()}
                                </motion.p>
                            </div>

                            <div className="relative p-1.5 rounded-xl bg-gray-50/50 border border-gray-100 min-h-[280px] w-full flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8" ref={buttonBoxRef}>
                                <div className="z-20">
                                    <Button
                                        size="lg"
                                        className="h-14 px-8 md:px-12 rounded-full text-lg font-bold shadow-lg hover:scale-105 transition-transform"
                                        style={{ backgroundColor: primaryColor }}
                                        onClick={() => handleResponse('yes')}
                                    >
                                        ¡Sí, acepto! ❤️
                                    </Button>
                                </div>

                                <MovingButton
                                    onTryClick={() => handleResponse('no')}
                                    containerRef={buttonBoxRef}
                                    className=""
                                    style={{
                                        borderColor: `${primaryColor}40`,
                                        color: primaryColor,
                                        backgroundColor: '#ffffff'
                                    }}
                                />
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="accepted"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center z-10"
                    >
                        <div className="bg-white/90 backdrop-blur-lg rounded-3xl p-8 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.2)] border-2 border-white max-w-md w-full">
                            <motion.div
                                animate={{
                                    scale: [1, 1.3, 1],
                                    rotate: [0, 10, -10, 0]
                                }}
                                transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 1 }}
                                className="inline-block mb-6"
                            >
                                <Heart fill={primaryColor} className="w-20 h-20 md:w-28 md:h-28" style={{ color: primaryColor }} />
                            </motion.div>

                            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                                {data.affectionLevel === 'te_amo' ? '¡Te amo más!' : '¡Yo también te quiero!'} ❤️
                            </h1>

                            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                                Has hecho que este día sea inolvidable. Prepárate para lo que viene... ✨
                            </p>

                            {/* <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
                                    <span className="text-3xl block mb-2">🏡</span>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Lugar</p>
                                    <p className="font-semibold text-gray-800">Nuestro nido</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
                                    <span className="text-3xl block mb-2">🎁</span>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Sorpresa</p>
                                    <p className="font-semibold text-gray-800">Próximamente</p>
                                </div>
                            </div> */}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main >
    );
}

export default function PublicPage() {
    return <PublicViewContent />
}
