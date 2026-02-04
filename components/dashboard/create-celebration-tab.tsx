'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PartyPopper, Copy, X, Camera, ImagePlus, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface User {
    role: string;
    maxRequests: number | null;
}

interface CreateCelebrationTabProps {
    onCreated: () => void;
    user: User | null;
    requestCount: number;
}

interface Occasion {
    id: string;
    name: string;
    slug: string;
    icon: string;
    primaryColor: string;
    secondaryColor: string;
    description: string;
}

// Mensajes sugeridos por ocasión
const messagesByOccasion: Record<string, string[]> = {
    'san-valentin': [
        "Desde que llegaste a mi vida, todo tiene más color y sentido. 💕",
        "Contigo he aprendido que el amor está en los pequeños detalles. 🌹",
        "No necesito un día especial para recordarte cuánto te quiero, pero hoy es la excusa perfecta. ❤️",
        "Eres la casualidad más bonita que me ha pasado. 💖",
        "Mi lugar favorito es a tu lado. 💍",
        "Gracias por ser mi paz en medio del caos. Celebremos el amor que nos tenemos. ✨"
    ],
    'aniversario': [
        "Cada día a tu lado es un regalo. Gracias por todos estos momentos compartidos. ¡Feliz aniversario! 💑",
        "El tiempo vuela cuando estoy contigo. Celebremos otro año de amor y complicidad. Te amo. 💖",
        "Contigo he vivido los mejores momentos de mi vida. Aquí está a muchos años más juntos. ¡Feliz aniversario! 🥂",
        "Parece que fue ayer cuando empezamos esta aventura. Gracias por elegirme cada día. Te amo. ✨",
        "No hay palabras para describir lo feliz que me haces. Brindemos por nosotros y por todo lo que viene. 🍷",
        "Eres mi mejor decisión. Feliz aniversario a la persona que me complementa a la perfección. 💕"
    ],
    'ano-nuevo': [
        "Que este nuevo año nos traiga más aventuras juntos. ¡Feliz Año Nuevo, mi amor! 🎆",
        "Gracias por hacer del año que termina algo inolvidable. Brindemos por lo que viene. ¡Feliz Año Nuevo! 🍾",
        "Comenzar un nuevo año a tu lado es el mejor regalo. ¡Feliz Año Nuevo! 🎊",
        "Mi único deseo para este año es seguir creciendo a tu lado. ¡Salud por nosotros! 🥂",
        "Que los próximos 365 días sean tan mágicos como los que ya vivimos. Te amo. ✨",
        "Nuevo año, mismas ganas de estar contigo. ¡Feliz año nuevo! ❤️"
    ],
    'navidad': [
        "La Navidad es más especial cuando la paso contigo. ¡Felices fiestas, mi amor! 🎄",
        "Eres el mejor regalo que la vida me ha dado. ¡Feliz Navidad! 🎁",
        "Que esta Navidad esté llena de amor y alegría para ambos. Te quiero mucho. ⭐",
        "Bajo el árbol solo quiero encontrarte a ti una y otra vez. ¡Feliz Navidad! 🎅",
        "Gracias por ser mi luz en estas fiestas. Te amo más de lo que las luces pueden brillar. ✨",
        "Que la magia de la Navidad nos mantenga tan unidos como siempre. 🕯️"
    ],
    'cumpleanos': [
        "¡Feliz cumpleaños a la persona más especial de mi vida! Que todos tus deseos se hagan realidad. 🎂",
        "Hoy celebramos tu vida y todo lo maravilloso que eres. ¡Feliz cumpleaños! 🎉",
        "Gracias por existir y por hacerme tan feliz. ¡Feliz cumpleaños, mi amor! 🎈",
        "Un año más de ti es un año más de felicidad para mí. ¡Disfruta tu día al máximo! 🎁",
        "Que este nuevo año de vida te traiga todo lo que mereces, que es lo mejor. ¡Te amo! 💖",
        "Brindo por tu vida y por todos los cumples que nos quedan por celebrar juntos. ✨"
    ],
    'halloween': [
        "Eres mi dulce favorito en esta noche de Halloween. 🎃",
        "No necesito un disfraz para mostrarte cuánto me gustas. 👻",
        "Eres el mejor susto (de amor) que me ha dado la vida. ¡Feliz Halloween! 🦇",
        "Haces un hechizo en mí que no quiero romper. 🧙‍♀️",
        "Contigo no tengo miedo a nada, excepto a perderte. ¡Feliz Halloween! 🕯️",
        "Truco o trato... pero contigo me quedo siempre con el trato de amarte. 🍬"
    ],
    'fiestas-patrias': [
        "Celebremos juntos el orgullo de ser peruanos. ¡Felices Fiestas Patrias! 🇵🇪",
        "Contigo todo se celebra mejor, incluso las Fiestas Patrias. ¡Arriba Perú! 🎊",
        "Que viva el Perú y que viva nuestro amor. ¡Felices Fiestas Patrias! 🎉",
        "Orgulloso de mi tierra y de tenerte a mi lado. ¡Felices Fiestas! ❤️",
        "Brindemos con pisco por nosotros y por nuestro gran país. 🥂",
        "Nuestro amor es tan grande como nuestra historia. ¡Felices Fiestas Patrias! 🇵🇪"
    ],
    'semana-santa': [
        "Aprovechemos estos días para descansar y disfrutar juntos. ¡Feliz Semana Santa! 🌴",
        "Una escapada contigo es todo lo que necesito. 🏖️",
        "Que esta Semana Santa nos traiga paz y momentos inolvidables juntos. 💙",
        "Días de reflexión y de agradecer que estás en mi camino. Te quiero. ✨",
        "Renovemos nuestras energías y nuestro cariño en estos días libres. 🌊",
        "Cualquier lugar es el paraíso si estoy contigo. ¡Feliz Semana Santa! 🐚"
    ],
    'personalizado': [
        "Desde que llegaste a mi vida, todo tiene más color y sentido. No puedo imaginarme un día sin tu risa. 🌟",
        "A veces me cuesta encontrar las palabras exactas para decirte lo importante que eres para mí, pero hoy quiero intentarlo: Eres mi alegría diaria. ❤️",
        "No necesito un día especial para recordarte cuánto te quiero, pero hoy es la excusa perfecta para celebrar que te tengo en mi vida. ✨",
        "Contigo he aprendido que el amor está en los pequeños detalles, en las risas compartidas y en la paz que me das. Me encantaría celebrar este día a tu lado. 🎊",
        "Cada momento contigo se convierte en un recuerdo favorito. Gracias por ser tú y por hacerme tan feliz. 💖",
        "Eres mi persona favorita y este detalle es solo una pequeña muestra de lo mucho que te valoro. 💎"
    ]
};

export function CreateCelebrationTab({ onCreated, user, requestCount }: CreateCelebrationTabProps) {
    const [occasions, setOccasions] = useState<Occasion[]>([]);
    const [selectedOccasion, setSelectedOccasion] = useState<Occasion | null>(null);
    const [partnerName, setPartnerName] = useState('');
    const [message, setMessage] = useState('');
    const [affectionLevel, setAffectionLevel] = useState('te_quiero');
    const [aniversarioYears, setAniversarioYears] = useState<string>('');
    const [aniversarioMonths, setAniversarioMonths] = useState<string>('');
    const [aniversarioValue, setAniversarioValue] = useState<string>(''); // Kept for 'personalizado' reuse
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingOccasions, setLoadingOccasions] = useState(true);
    const [createdSlug, setCreatedSlug] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch occasions from backend
    useEffect(() => {
        const fetchOccasions = async () => {
            try {
                const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
                const response = await axios.get(`${backendUrl}/occasions`);
                setOccasions(response.data);
            } catch (error) {
                console.error('Error fetching occasions', error);
                toast.error('Error al cargar las ocasiones');
            } finally {
                setLoadingOccasions(false);
            }
        };
        fetchOccasions();
    }, []);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImage(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const suggestMessage = () => {
        if (!selectedOccasion) return;
        const messages = messagesByOccasion[selectedOccasion.slug] || messagesByOccasion['personalizado'];
        setMessage(messages[Math.floor(Math.random() * messages.length)]);
    };

    const createRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem('auth_token');
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

            const formData = new FormData();
            formData.append('partnerName', partnerName);
            formData.append('message', message);
            formData.append('affectionLevel', affectionLevel);
            if (image) formData.append('image', image);
            if (selectedOccasion) formData.append('occasionId', selectedOccasion.id);

            const extraData: Record<string, unknown> = {};

            // Handle extraData for Aniversario
            if (selectedOccasion?.slug === 'aniversario') {
                const y = parseInt(aniversarioYears || '0');
                const m = parseInt(aniversarioMonths || '0');

                if (y > 0 && m > 0) {
                    extraData.aniversarioType = 'mixed';
                    extraData.aniversarioValue = `${y}|${m}`;
                } else if (y > 0) {
                    extraData.aniversarioType = 'anios';
                    extraData.aniversarioValue = y.toString();
                } else if (m > 0) {
                    extraData.aniversarioType = 'meses';
                    extraData.aniversarioValue = m.toString();
                }
            }

            // Handle extraData for Personalizado
            if (selectedOccasion?.slug === 'personalizado' && aniversarioValue) {
                extraData.customName = aniversarioValue;
            }

            // Handle anonymity
            if (isAnonymous) {
                extraData.isAnonymous = true;
            }

            if (Object.keys(extraData).length > 0) {
                formData.append('extraData', JSON.stringify(extraData));
            }

            const response = await axios.post(
                `${backendUrl}/celebration`,
                formData,
                { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
            );

            setCreatedSlug(response.data.slug);
            toast.success('¡Enlace mágico creado con éxito! 💖');
            setPartnerName('');
            setMessage('');
            setAffectionLevel('te_quiero');
            setImage(null);
            setPreview(null);
            setSelectedOccasion(null);
            setAniversarioValue('');
            setAniversarioYears('');
            setAniversarioMonths('');
            setIsAnonymous(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
            onCreated();

        } catch (error) {
            console.error('Error creating request', error);
            if (axios.isAxiosError(error) && error.response?.data?.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error('Error al crear la solicitud. Intenta nuevamente.');
            }
        } finally {
            setLoading(false);
        }
    };

    const copyLink = (slug: string) => {
        const url = `${window.location.origin}/c/${slug}`;
        navigator.clipboard.writeText(url);
        toast.success('Enlace copiado al portapapeles 📋');
    };

    const limitReached = user && user.role !== 'admin' && user.maxRequests !== null && requestCount >= user.maxRequests;

    // Obtener emoji del icono
    const getEmojiFromIcon = (icon: string) => {
        const emojiMap: Record<string, string> = {
            'heart': '💖',
            'rings': '💍',
            'clock': '🕐',
            'tree': '🎄',
            'cake': '🎂',
            'pumpkin': '🎃',
            'flag-pe': '🇵🇪',
            'palm': '🌴',
            'sparkles': '✨'
        };
        if (icon === 'flag-pe') {
            return (
                <div className="flex flex-col items-center justify-center w-8 h-6 rounded border border-gray-100 overflow-hidden shadow-sm">
                    <div className="w-full h-full flex">
                        <div className="w-1/3 h-full bg-[#D91023]" />
                        <div className="w-1/3 h-full bg-white" />
                        <div className="w-1/3 h-full bg-[#D91023]" />
                    </div>
                </div>
            );
        }
        return <span className="text-2xl">{emojiMap[icon] || '🎉'}</span>;
    };

    return (
        <Card className="shadow-sm border-purple-200">
            <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-purple-950">Nueva Celebración 🎉</CardTitle>
                    {user && user.role !== 'admin' && user.maxRequests !== null && (
                        <span className={`text-xs font-bold px-2 py-1 rounded-full border ${limitReached ? 'bg-red-50 text-red-600 border-red-100' : 'bg-purple-50 text-purple-600 border-purple-100'}`}>
                            {requestCount} / {user.maxRequests}
                        </span>
                    )}
                </div>
                <CardDescription className="text-xs">
                    {limitReached ? 'Has alcanzado el límite de celebraciones permitidas.' : 'Crea una invitación especial para alguien importante'}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 px-4 pb-4">
                {limitReached ? (
                    <div className="py-8 text-center flex flex-col items-center gap-3 animate-in fade-in zoom-in duration-300">
                        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-2">
                            <X className="w-6 h-6" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900">¡Límite Alcanzado! 🛑</h3>
                        <p className="text-xs text-gray-500 max-w-[250px]">
                            Has usado tus <strong>{requestCount}</strong> de <strong>{user?.maxRequests}</strong> enlaces disponibles.
                            Elimina alguno antiguo si necesitas crear uno nuevo.
                        </p>
                    </div>
                ) : !createdSlug ? (
                    <>
                        {/* Selector de Ocasión */}
                        {!selectedOccasion ? (
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-700">Selecciona la ocasión especial</label>
                                {loadingOccasions ? (
                                    <div className="text-center py-8 text-gray-400">Cargando ocasiones...</div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2">
                                        {occasions.map((occasion) => (
                                            <button
                                                key={occasion.id}
                                                onClick={() => setSelectedOccasion(occasion)}
                                                className="group relative p-3 rounded-xl border-2 border-gray-200 hover:border-purple-400 bg-white hover:bg-purple-50/50 transition-all duration-200 text-left"
                                                style={{
                                                    borderColor: `${occasion.primaryColor}20`
                                                }}
                                            >
                                                <div className="flex items-center gap-2 mb-1">
                                                    {getEmojiFromIcon(occasion.icon)}
                                                    <ChevronRight className="w-4 h-4 text-gray-400 ml-auto group-hover:text-purple-600 transition-colors" />
                                                </div>
                                                <div className="text-xs font-semibold text-gray-900">{occasion.name}</div>
                                                <div className="text-[10px] text-gray-500 line-clamp-2">{occasion.description}</div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                {/* Ocasión seleccionada */}
                                <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-purple-100 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                                    {getEmojiFromIcon(selectedOccasion.icon)}
                                    <div className="flex-1">
                                        <div className="text-xs font-semibold text-purple-900">{selectedOccasion.name}</div>
                                        <div className="text-[10px] text-purple-600">{selectedOccasion.description}</div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setSelectedOccasion(null);
                                            setAniversarioValue('');
                                            setAniversarioYears('');
                                            setAniversarioMonths('');
                                        }}
                                        className="text-purple-300 hover:text-red-500 p-1 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-700">Nombre de tu persona especial</label>
                                    <Input
                                        className="h-8 text-sm focus-visible:ring-purple-400"
                                        placeholder="Ej. María, Mi amor..."
                                        value={partnerName}
                                        onChange={(e) => setPartnerName(e.target.value)}
                                    />
                                </div>

                                {/* Campos específicos para Aniversario */}
                                {selectedOccasion.slug === 'aniversario' && (
                                    <div className="space-y-2 p-3 bg-amber-50/50 rounded-xl border border-amber-100 animate-in zoom-in-95 duration-300">
                                        <label className="text-xs font-semibold text-amber-900 flex items-center gap-1">
                                            💍 ¿Qué aniversario celebran?
                                        </label>
                                        <div className="flex gap-2">
                                            <div className="flex-1 space-y-1">
                                                <label className="text-[10px] font-bold text-amber-700/70 uppercase">Años</label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    className="h-9 text-sm border-amber-200 focus-visible:ring-amber-400 bg-white"
                                                    placeholder="0"
                                                    value={aniversarioYears}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (parseInt(val) < 0) return; // Prevent negative
                                                        setAniversarioYears(val);
                                                    }}
                                                />
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <label className="text-[10px] font-bold text-amber-700/70 uppercase">Meses</label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    max="11"
                                                    className="h-9 text-sm border-amber-200 focus-visible:ring-amber-400 bg-white"
                                                    placeholder="0"
                                                    value={aniversarioMonths}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (parseInt(val) < 0) return; // Prevent negative
                                                        setAniversarioMonths(val);
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Campos específicos para Personalizado */}
                                {selectedOccasion.slug === 'personalizado' && (
                                    <div className="space-y-2 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 animate-in zoom-in-95 duration-300">
                                        <label className="text-xs font-semibold text-indigo-900 flex items-center gap-1">
                                            ✨ Nombre de la celebración
                                        </label>
                                        <Input
                                            className="h-8 text-sm border-indigo-200 focus-visible:ring-indigo-400"
                                            placeholder="Ej. Graduación, Nuevo hogar..."
                                            value={aniversarioValue}
                                            onChange={(e) => setAniversarioValue(e.target.value)}
                                        />
                                    </div>
                                )}

                                {/* Opción Anónima */}
                                <div className="flex items-center justify-between p-3 bg-gray-50/80 rounded-xl border border-gray-100 transition-all hover:bg-gray-50">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-semibold text-gray-700">Enviar de forma anónima</span>
                                        <span className="text-[10px] text-gray-500">Ocultar tu nombre en la invitación</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsAnonymous(!isAnonymous)}
                                        className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 ${isAnonymous ? 'bg-purple-600' : 'bg-gray-300'}`}
                                    >
                                        <span
                                            className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform ${isAnonymous ? 'translate-x-5' : 'translate-x-1'}`}
                                        />
                                    </button>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-medium text-gray-700">Mensaje personalizado (Opcional)</label>
                                        <button
                                            type="button"
                                            onClick={suggestMessage}
                                            className="text-[10px] text-purple-500 hover:text-purple-700 hover:underline cursor-pointer flex items-center gap-1 transition-colors"
                                        >
                                            ✨ Sugiéreme algo
                                        </button>
                                    </div>
                                    <textarea
                                        className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                                        placeholder={`Ej. Eres lo mejor que me ha pasado... 🌹`}
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-gray-700">Nivel de Intensidad 💘</label>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant={affectionLevel === 'te_quiero' ? 'default' : 'outline'}
                                            className={`flex-1 h-8 text-xs transition-all ${affectionLevel === 'te_quiero' ? 'bg-pink-500 hover:bg-pink-600 shadow-md shadow-pink-100 scale-[1.02]' : 'text-pink-500 border-pink-200'}`}
                                            onClick={() => setAffectionLevel('te_quiero')}
                                        >
                                            Te Quiero 🌸
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant={affectionLevel === 'te_amo' ? 'default' : 'outline'}
                                            className={`flex-1 h-8 text-xs transition-all ${affectionLevel === 'te_amo' ? 'bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-100 scale-[1.02]' : 'text-purple-600 border-purple-200'}`}
                                            onClick={() => setAffectionLevel('te_amo')}
                                        >
                                            Te Amo ❤️
                                        </Button>
                                    </div>
                                    <p className="text-[10px] text-gray-500 text-center">
                                        {affectionLevel === 'te_amo' ? 'Final: "¡Te amo!"' : 'Final: "¡Te quiero mucho!"'}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-700">Foto de los dos 📸 (Opcional)</label>

                                    {!preview ? (
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="group relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-purple-200 rounded-xl bg-purple-50/30 hover:bg-purple-50 hover:border-purple-400 transition-all cursor-pointer overflow-hidden p-6"
                                        >
                                            <div className="flex flex-col items-center gap-3 transition-transform duration-500 group-hover:scale-105">
                                                <div className="p-4 bg-white rounded-2xl shadow-sm text-purple-500 group-hover:rotate-6 transition-transform duration-300">
                                                    <ImagePlus className="w-8 h-8 animate-pulse" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-base font-semibold text-purple-900">¡Sube un recuerdo juntos! 📸</p>
                                                    <p className="text-xs text-purple-400 font-medium">PNG, JPG o GIF • Max 10MB</p>
                                                </div>
                                            </div>

                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleImageChange}
                                            />
                                        </div>
                                    ) : (
                                        <div className="space-y-3 animate-in fade-in duration-300">
                                            <div className="relative w-full h-auto rounded-xl overflow-hidden border-2 border-purple-100 shadow-md group">
                                                <Image
                                                    src={preview}
                                                    alt="Vista previa"
                                                    width={500}
                                                    height={256}
                                                    className="w-full h-auto max-h-64 object-contain bg-purple-50/50"
                                                />
                                                <div className="absolute inset-0 bg-black/40 hidden md:flex opacity-0 group-hover:opacity-100 transition-opacity items-center justify-center gap-2 z-10">
                                                    <Button
                                                        size="sm"
                                                        variant="secondary"
                                                        className="h-8 text-xs font-bold gap-2"
                                                        onClick={() => fileInputRef.current?.click()}
                                                    >
                                                        <Camera className="w-3.5 h-3.5" /> Cambiar
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        className="h-8 text-xs font-bold gap-2"
                                                        onClick={() => {
                                                            setImage(null);
                                                            setPreview(null);
                                                            if (fileInputRef.current) fileInputRef.current.value = '';
                                                        }}
                                                    >
                                                        <X className="w-3.5 h-3.5" /> Quitar
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="flex md:hidden items-center justify-center gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-9 text-xs font-bold gap-2 flex-1 bg-white border-purple-200 text-purple-600 shadow-sm"
                                                    onClick={() => fileInputRef.current?.click()}
                                                >
                                                    <Camera className="w-4 h-4" /> Cambiar
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-9 text-xs font-bold gap-2 flex-1 bg-white border-red-100 text-red-500 shadow-sm"
                                                    onClick={() => {
                                                        setImage(null);
                                                        setPreview(null);
                                                        if (fileInputRef.current) fileInputRef.current.value = '';
                                                    }}
                                                >
                                                    <X className="w-4 h-4" /> Quitar
                                                </Button>
                                            </div>

                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleImageChange}
                                            />
                                        </div>
                                    )}
                                </div>
                                <Button
                                    onClick={createRequest}
                                    disabled={loading || !partnerName.trim()}
                                    className="w-full bg-purple-600 hover:bg-purple-700 mt-2 h-9 text-sm font-bold shadow-lg shadow-purple-100"
                                >
                                    {loading ? 'Creando...' : 'Crear Enlace Mágico ✨'}
                                </Button>
                            </>
                        )}
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-3 py-2 animate-in fade-in zoom-in duration-500">
                        <div className="bg-green-100 p-2 rounded-full">
                            <PartyPopper className="w-5 h-5 text-green-600" />
                        </div>
                        <p className="text-center font-medium text-sm text-gray-800">¡Listo! 🥳</p>
                        <div className="w-full flex items-center gap-2 p-1.5 bg-gray-50 rounded-md border border-gray-200">
                            <span className="text-xs text-gray-500 truncate flex-1 pl-1">
                                {`${typeof window !== 'undefined' ? window.location.origin : ''}/c/${createdSlug}`}
                            </span>
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => createdSlug && copyLink(createdSlug)} title="Copiar">
                                <Copy className="w-3 h-3" />
                            </Button>
                        </div>
                        <Button
                            variant="outline"
                            className="w-full h-8 text-xs font-bold"
                            onClick={() => setCreatedSlug(null)}
                        >
                            Crear otro enlace
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card >
    );
}
