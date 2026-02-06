'use client';

import { getOptimizedImageUrl } from '@/lib/image-utils';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Copy, Trash2, Edit2, Save, X, Camera } from 'lucide-react';
import { Input } from '@/components/ui/input';

import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';

interface CelebrationRequest {
    id: string;
    partnerName: string;
    message?: string;
    slug: string;
    response: string;
    affectionLevel?: string;
    imagePath?: string | null;
    occasion?: Occasion;
    extraData?: {
        isAnonymous?: boolean;
    };
}

interface Occasion {
    id: string;
    name: string;
    slug: string;
    icon: string;
    primaryColor: string;
    secondaryColor: string;
}

interface MyRequestsTabProps {
    requests: CelebrationRequest[];
    setRequests: React.Dispatch<React.SetStateAction<CelebrationRequest[]>>;
}

export function MyRequestsTab({ requests, setRequests }: MyRequestsTabProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editMessage, setEditMessage] = useState('');
    const [editAffection, setEditAffection] = useState('te_amo');
    const [editIsAnonymous, setEditIsAnonymous] = useState(false);
    const [editImage, setEditImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [shouldDeleteImage, setShouldDeleteImage] = useState(false);
    const [requestToDelete, setRequestToDelete] = useState<string | null>(null);
    const [occasions, setOccasions] = useState<Occasion[]>([]);
    const [editOccasionId, setEditOccasionId] = useState<string>('');
    const [editResponse, setEditResponse] = useState<string>('pending');

    const copyLink = (slug: string) => {
        const url = `${window.location.origin}/c/${slug}`;
        navigator.clipboard.writeText(url);
        toast.success('Enlace copiado al portapapeles 📋');
    };

    const handleDelete = async (id: string) => {
        setRequestToDelete(id);
    };

    const executeDelete = async () => {
        if (!requestToDelete) return;

        // Optimistic Update: Update UI immediately
        const previousRequests = [...requests];
        setRequests(requests.filter(r => r.id !== requestToDelete));
        setRequestToDelete(null); // Close modal immediately

        try {
            const token = localStorage.getItem('auth_token');
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
            await axios.post(`${backendUrl}/celebration/${requestToDelete}/delete`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Enlace eliminado correctamente');
        } catch (error) {
            console.error('Error deleting', error);
            toast.error('Error al eliminar, restaurando...');
            setRequests(previousRequests); // Revert on failure
        }
    };

    const handleUpdate = async (id: string) => {
        try {
            const token = localStorage.getItem('auth_token');
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

            const formData = new FormData();
            formData.append('partnerName', editName);
            formData.append('message', editMessage);
            formData.append('occasionId', editOccasionId);
            formData.append('affectionLevel', editAffection);
            formData.append('response', editResponse);
            formData.append('extraData', JSON.stringify({ isAnonymous: editIsAnonymous }));
            if (editImage) {
                formData.append('image', editImage);
            }
            if (shouldDeleteImage) {
                formData.append('deleteImage', 'true');
            }

            const response = await axios.patch(`${backendUrl}/celebration/${id}`,
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setRequests(requests.map(r => r.id === id ? {
                ...r,
                partnerName: editName,
                message: editMessage,
                affectionLevel: editAffection,
                response: editResponse,
                occasion: occasions.find(o => o.id === editOccasionId) || r.occasion,
                imagePath: shouldDeleteImage ? null : (response.data.imagePath || r.imagePath)
            } : r));
            setEditingId(null);
            toast.success('Actualizado correctamente ✨');
        } catch (error) {
            console.error('Error updating', error);
            toast.error('Error al actualizar');
        }
    };

    const startEdit = (request: CelebrationRequest) => {
        setEditingId(request.id);
        setEditName(request.partnerName);
        setEditMessage(request.message || '');
        setEditAffection(request.affectionLevel || 'te_amo');
        setEditIsAnonymous(request.extraData?.isAnonymous || false);
        setEditOccasionId(request.occasion?.id || '');
        setEditResponse(request.response || 'pending');
        setEditImage(null);
        setShouldDeleteImage(false);
        setImagePreview(request.imagePath ? getOptimizedImageUrl(request.imagePath, { width: 800 }) : null);
    };

    const toggleResponse = async (req: CelebrationRequest) => {
        const newResponse = req.response === 'yes' ? 'pending' : 'yes';
        // Optimistic Update
        setRequests(requests.map(r => r.id === req.id ? { ...r, response: newResponse } : r));

        try {
            const token = localStorage.getItem('auth_token');
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

            const formData = new FormData();
            formData.append('response', newResponse);

            await axios.patch(`${backendUrl}/celebration/${req.id}`,
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success(`Estado actualizado a ${newResponse === 'yes' ? 'Si' : 'Pendiente'}`);
        } catch (error) {
            console.error('Error updating status', error);
            toast.error('Error al actualizar estado');
            // Revert
            setRequests(requests.map(r => r.id === req.id ? { ...r, response: req.response } : r));
        }
    };

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // Polling for Real-time updates
    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const token = localStorage.getItem('auth_token');
                if (!token) return; // Don't fetch if no token

                const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
                const res = await axios.get(`${backendUrl}/celebration/mine/custom-all`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setRequests(res.data);

                // Fetch occasions if not loaded
                if (occasions.length === 0) {
                    const occasionsRes = await axios.get(`${backendUrl}/occasions`);
                    setOccasions(occasionsRes.data);
                }
            } catch (error) {
                console.error('Polling error', error);
                if (axios.isAxiosError(error) && error.response?.status === 401) {
                    // Token is invalid/expired (likely due to DB reset)
                    localStorage.removeItem('auth_token');
                    window.location.href = '/login';
                }
            }
        };

        fetchRequests(); // Run immediately

        const interval = setInterval(fetchRequests, 5000); // Poll every 5 seconds
        return () => clearInterval(interval);
    }, [setRequests, occasions.length]);

    // Pagination Logic
    const totalPages = Math.ceil(requests.length / itemsPerPage);
    const currentRequests = requests.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
    };

    const handlePrevPage = () => {
        if (currentPage > 1) setCurrentPage(prev => prev - 1);
    };

    if (requests.length === 0) {
        return (
            <div className="text-center py-10 text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
                <p>Aún no has creado ninguna celebración.</p>
                <p className="text-sm mt-2">¡Ve a la pestaña &quot;Crear&quot; para empezar!</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3 animate-in slide-in-from-bottom-5 fade-in duration-500">
            <div className="grid gap-3">
                {currentRequests.map((req) => (
                    <div key={req.id} className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white border border-purple-100 rounded-lg hover:border-purple-300 transition-all shadow-sm">
                        <div className="flex-1 min-w-0">
                            {editingId === req.id ? (
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-start gap-3">
                                        <div className="relative group/img h-14 w-14 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center overflow-hidden shrink-0 shadow-sm transition-all hover:border-purple-300">
                                            {imagePreview ? (
                                                <div className="relative h-full w-full flex items-center justify-center bg-white/50">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={imagePreview} alt="Preview" className="max-h-full max-w-full object-contain" />
                                                    <div className="absolute inset-0 bg-black/20 md:opacity-0 md:group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                setImagePreview(null);
                                                                setEditImage(null);
                                                                setShouldDeleteImage(true);
                                                            }}
                                                            className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg transform hover:scale-110 transition-all active:scale-90"
                                                            title="Eliminar foto"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center gap-0.5">
                                                    <Camera className="w-4 h-4 text-purple-300" />
                                                    <span className="text-[6px] font-bold text-purple-400 uppercase">Subir</span>
                                                </div>
                                            )}
                                            <input
                                                type="file"
                                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        setEditImage(file);
                                                        setImagePreview(URL.createObjectURL(file));
                                                        setShouldDeleteImage(false);
                                                    }
                                                }}
                                                accept="image/*"
                                            />
                                        </div>
                                        <div className="flex-1 flex flex-col gap-2">
                                            <div className="flex gap-2 items-center">
                                                <Input
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    className="h-8 text-sm font-semibold flex-1 px-3 rounded-lg border-gray-200"
                                                    placeholder="Nombre"
                                                />
                                                <select
                                                    value={editOccasionId}
                                                    onChange={(e) => setEditOccasionId(e.target.value)}
                                                    className="h-8 text-xs border-gray-200 border rounded-lg px-2 bg-white text-gray-600 focus:ring-1 focus:ring-purple-200 cursor-pointer w-32 font-medium"
                                                >
                                                    {occasions.map(occ => (
                                                        <option key={occ.id} value={occ.id}>
                                                            {occ.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="flex gap-1">
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-green-500 hover:bg-green-50 hover:text-green-600 rounded-lg border border-green-200 bg-white flex items-center justify-center transition-colors shadow-sm" onClick={() => handleUpdate(req.id)} title="Guardar">
                                                        <Save className="w-4 h-4" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:bg-gray-50 hover:text-gray-500 rounded-lg border border-gray-200 bg-white flex items-center justify-center transition-colors shadow-sm" onClick={() => setEditingId(null)} title="Cancelar">
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <textarea
                                                value={editMessage}
                                                onChange={(e) => setEditMessage(e.target.value)}
                                                className="w-full text-sm rounded-lg border border-gray-200 px-3 py-1.5 h-14 resize-y focus:ring-1 focus:ring-purple-200 text-gray-700 leading-snug"
                                                placeholder="Mensaje..."
                                            />
                                            <div className="flex items-center gap-3">
                                                <select
                                                    value={editResponse}
                                                    onChange={(e) => setEditResponse(e.target.value)}
                                                    className={`h-7 text-xs border rounded-md px-2 font-bold cursor-pointer transition-colors ${editResponse === 'yes' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}
                                                >
                                                    <option value="yes">Aceptado (SI)</option>
                                                    <option value="pending">Pendiente</option>
                                                </select>

                                                <div className="h-4 w-px bg-gray-200"></div>

                                                <div className="flex items-center gap-1.5 active:opacity-70 transition-opacity select-none cursor-pointer" onClick={() => setEditIsAnonymous(!editIsAnonymous)}>
                                                    <input
                                                        type="checkbox"
                                                        checked={editIsAnonymous}
                                                        onChange={() => { }} // Handled by parent
                                                        className="w-3.5 h-3.5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 pointer-events-none"
                                                    />
                                                    <span className="text-xs font-medium text-gray-500">
                                                        Anónimo
                                                    </span>
                                                </div>

                                                <div className="flex-1"></div>

                                                <div className="flex gap-1.5">
                                                    <button
                                                        className={`px-3 py-0.5 text-[10px] rounded-full border transition-all active:scale-95 ${editAffection === 'te_quiero' ? 'bg-pink-50 text-pink-600 border-pink-100 font-bold' : 'text-gray-400 border-gray-100 hover:border-pink-100 bg-white'}`}
                                                        onClick={() => setEditAffection('te_quiero')}
                                                    >
                                                        Te Quiero
                                                    </button>
                                                    <button
                                                        className={`px-3 py-0.5 text-[10px] rounded-full border transition-all active:scale-95 ${editAffection === 'te_amo' ? 'bg-purple-50 text-purple-600 border-purple-100 font-bold' : 'text-gray-400 border-gray-100 hover:border-purple-100 bg-white'}`}
                                                        onClick={() => setEditAffection('te_amo')}
                                                    >
                                                        Te Amo
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-sm text-gray-900 truncate">{req.partnerName}</h3>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleResponse(req);
                                            }}
                                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider cursor-pointer hover:opacity-80 transition-all active:scale-95 ${req.response === 'yes' ? 'bg-green-100 text-green-700' : 'bg-amber-50 text-amber-600'}`}
                                            title="Clic para cambiar estado"
                                        >
                                            {req.response === 'yes' ? 'SI' : 'PENDIENTE'}
                                        </button>
                                        {req.occasion && (
                                            <span
                                                className="text-[10px] px-2 py-0.5 rounded-full font-medium border"
                                                style={{
                                                    backgroundColor: `${req.occasion.primaryColor}10`,
                                                    color: req.occasion.primaryColor,
                                                    borderColor: `${req.occasion.primaryColor}30`
                                                }}
                                            >
                                                {req.occasion.name}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        {req.message && <p className="text-xs text-gray-500 italic whitespace-pre-wrap leading-relaxed">&quot;{req.message}&quot;</p>}
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-purple-400 border border-purple-100 px-2 py-0.5 rounded-full font-medium">
                                                {req.affectionLevel === 'te_quiero' ? '🌸 Te Quiero' : '❤️ Te Amo'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {editingId !== req.id && (
                            <div className="flex items-center gap-1 self-end sm:self-center">
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-purple-500 hover:bg-purple-50 hover:text-purple-600" onClick={() => copyLink(req.slug)} title="Copiar">
                                    <Copy className="w-3.5 h-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:bg-gray-100 hover:text-gray-600" onClick={() => startEdit(req)} title="Editar">
                                    <Edit2 className="w-3.5 h-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-300 hover:bg-red-50 hover:text-red-500" onClick={() => handleDelete(req.id)} title="Eliminar">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        )}
                    </div>
                ))
                }
            </div >

            {/* Pagination Controls */}
            {
                totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={handlePrevPage}
                            disabled={currentPage === 1}
                        >
                            Anterior
                        </Button>
                        <span className="text-xs text-gray-500">
                            {currentPage} / {totalPages}
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={handleNextPage}
                            disabled={currentPage === totalPages}
                        >
                            Siguiente
                        </Button>
                    </div>
                )
            }

            {/* Confirmation Dialog */}
            <Dialog open={!!requestToDelete} onOpenChange={(open) => !open && setRequestToDelete(null)}>
                <DialogContent className="max-w-xs sm:max-w-sm p-6 rounded-2xl bg-white shadow-xl z-[50]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-purple-950 text-center">¿Eliminar enlace? 💔</DialogTitle>
                        <DialogDescription className="text-center text-gray-500">
                            No podrás recuperar este enlace ni sus respuestas.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-3 mt-4">
                        <Button
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl h-11"
                            onClick={executeDelete}
                        >
                            Sí, eliminar
                        </Button>
                        <Button
                            variant="ghost"
                            className="w-full text-gray-500 hover:bg-gray-50 hover:text-gray-800 rounded-xl h-11"
                            onClick={() => setRequestToDelete(null)}
                        >
                            Cancelar
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div >
    );
}
