'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { ExternalLink, Trash2, Edit2, Save, X, Camera, Ban, Check, Copy } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { getOptimizedImageUrl } from '@/lib/image-utils';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    avatar?: string;
    maxRequests: number;
    requestsCount?: number;
}

interface Occasion {
    id: string;
    name: string;
    slug: string;
    icon: string;
    primaryColor: string;
    secondaryColor: string;
}

interface CelebrationRequest {
    id: string;
    partnerName: string;
    message?: string;
    slug: string;
    response: string;
    imagePath?: string | null;
    createdAt: string;
    affectionLevel?: string;
    isAccepted?: boolean;
    isAnonymous?: boolean;
    occasion?: Occasion;
}

// Add props interface
interface AdminUsersTabProps {
    requestsCount?: number;
    occasions: Occasion[];
    users: User[];
    loadingUsers: boolean;
}

export function AdminUsersTab({ requestsCount, occasions, users: initialUsers, loadingUsers: initialLoadingUsers }: AdminUsersTabProps) {
    const [users, setUsers] = useState<User[]>(initialUsers);
    const [loading, setLoading] = useState(initialLoadingUsers);
    const [selectedUserForRequests, setSelectedUserForRequests] = useState<User | null>(null);
    const [userRequests, setUserRequests] = useState<CelebrationRequest[]>([]);
    const [loadingRequests, setLoadingRequests] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Cache for user requests to avoid refetching
    const [requestsCache, setRequestsCache] = useState<Map<string, CelebrationRequest[]>>(new Map());

    // Edit State for Modal
    const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editMessage, setEditMessage] = useState('');
    const [editAffection, setEditAffection] = useState('te_amo');
    const [editIsAnonymous, setEditIsAnonymous] = useState(false);
    const [editImage, setEditImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [shouldDeleteImage, setShouldDeleteImage] = useState(false);
    const [editOccasionId, setEditOccasionId] = useState<string>('');

    // Pagination State (Users)
    const [currentPage, setCurrentPage] = useState(1);

    // Delete State
    const [userToDelete, setUserToDelete] = useState<string | null>(null);
    const [requestToDelete, setRequestToDelete] = useState<string | null>(null);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('auth_token');
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
            const response = await axios.get(`${backendUrl}/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users', error);
            toast.error('Error al cargar usuarios');
        } finally {
            setLoading(false);
        }
    };

    // Sync with props when they change
    useEffect(() => {
        setUsers(initialUsers);
        setLoading(initialLoadingUsers);
    }, [initialUsers, initialLoadingUsers]);

    useEffect(() => {
        // Only fetch if we don't have users yet
        if (users.length === 0 && !loading) {
            fetchUsers();
        }
    }, []);
    const itemsPerPage = 5;

    // Pagination State (Requests)
    const [currentPageRequests, setCurrentPageRequests] = useState(1);
    const itemsPerPageRequests = 5;

    const toggleStatus = async (userId: string, currentStatus: string) => {
        try {
            const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
            const token = localStorage.getItem('auth_token');
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

            await axios.patch(`${backendUrl}/users/${userId}/status`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
            toast.success(`Usuario ${newStatus === 'active' ? 'activado' : 'desactivado'} correctamente`);
        } catch (error) {
            console.error('Error updating status', error);
            // Check if it's our specific security error
            if (axios.isAxiosError(error) && error.response?.status === 401) {
                toast.error(error.response.data.message);
            } else {
                toast.error('Error al actualizar estado');
            }
        }
    };

    const handleViewRequests = async (user: User) => {
        setSelectedUserForRequests(user);
        setIsDialogOpen(true);
        setCurrentPageRequests(1); // Reset requests page

        // Check cache first
        const cachedRequests = requestsCache.get(user.id);
        if (cachedRequests) {
            setUserRequests(cachedRequests);
            setLoadingRequests(false);
            return;
        }

        // If not in cache, fetch from API
        setLoadingRequests(true);
        try {
            const token = localStorage.getItem('auth_token');
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
            const res = await axios.get(`${backendUrl}/celebration/admin/user/${user.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUserRequests(res.data);

            // Store in cache
            setRequestsCache(prev => new Map(prev).set(user.id, res.data));
        } catch (error) {
            console.error('Error fetching user requests', error);
            toast.error('Error al cargar enlaces del usuario');
        } finally {
            setLoadingRequests(false);
        }
    };

    // Admin Delete Request Function (from within User View)
    // Admin Delete Request Function (from within User View)
    const handleDeleteRequest = async (requestId: string) => {
        // Logic moved to confirmation dialog execution
        setRequestToDelete(requestId);
    };

    const executeDeleteRequest = async () => {
        if (!requestToDelete) return;

        try {
            const token = localStorage.getItem('auth_token');
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
            await axios.delete(`${backendUrl}/celebration/admin/${requestToDelete}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setUserRequests(prev => prev.filter(r => r.id !== requestToDelete));

            if (selectedUserForRequests) {
                setUsers(prevUsers => prevUsers.map(u =>
                    u.id === selectedUserForRequests.id
                        ? { ...u, requestsCount: Math.max(0, (u.requestsCount || 0) - 1) }
                        : u
                ));
            }

            toast.success('Enlace eliminado correctamente');
            setRequestToDelete(null); // Close confirmation
        } catch (error) {
            console.error('Error eliminating request', error);
            toast.error('Error al eliminar el enlace');
        }
    };

    const startEditRequest = (req: CelebrationRequest) => {
        setEditingRequestId(req.id);
        setEditName(req.partnerName);
        setEditMessage(req.message || '');
        setEditAffection(req.affectionLevel || 'te_amo');
        // @ts-expect-error extraData might be undefined in strict mode but exists at runtime
        setEditIsAnonymous(req.extraData?.isAnonymous || false);
        setEditOccasionId(req.occasion?.id || '');
        setEditImage(null);
        setShouldDeleteImage(false);
        setImagePreview(getOptimizedImageUrl(req.imagePath, { width: 800 }));
    };

    const handleUpdateAdmin = async (id: string) => {
        try {
            const token = localStorage.getItem('auth_token');
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

            const formData = new FormData();
            formData.append('partnerName', editName);
            formData.append('message', editMessage);
            formData.append('occasionId', editOccasionId);
            formData.append('affectionLevel', editAffection);
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

            const updatedRequests = userRequests.map(r => r.id === id ? {
                ...r,
                partnerName: editName,
                message: editMessage,
                affectionLevel: editAffection,
                occasion: occasions.find(o => o.id === editOccasionId) || r.occasion,
                imagePath: shouldDeleteImage ? null : (response.data.imagePath || r.imagePath)
            } : r);

            setUserRequests(updatedRequests);

            // Update cache
            if (selectedUserForRequests) {
                setRequestsCache(prev => new Map(prev).set(selectedUserForRequests.id, updatedRequests));
            }

            setEditingRequestId(null);
            toast.success('Actualizado correctamente ✨');
        } catch (error) {
            console.error('Error updating', error);
            toast.error('Error al actualizar');
        }
    };

    const toggleRole = async (userId: string, currentRole: string) => {
        try {
            const newRole = currentRole === 'admin' ? 'user' : 'admin';
            const token = localStorage.getItem('auth_token');
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

            await axios.patch(`${backendUrl}/users/${userId}/role`,
                { role: newRole },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
            toast.success(`Rol actualizado a ${newRole === 'admin' ? 'Administrador' : 'Usuario'}`);
        } catch (error) {
            console.error('Error updating role', error);
            if (axios.isAxiosError(error) && error.response?.status === 401) {
                toast.error(error.response.data.message);
            } else {
                toast.error('Error al actualizar rol');
            }
        }
    };

    const handleDeleteUser = async (userId: string) => {
        setUserToDelete(userId);
    };

    const executeDeleteUser = async () => {
        if (!userToDelete) return;

        try {
            const token = localStorage.getItem('auth_token');
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

            await axios.delete(`${backendUrl}/users/${userToDelete}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setUsers(users.filter(u => u.id !== userToDelete));
            toast.success('Usuario eliminado permanentemente');
            setUserToDelete(null);
        } catch (error) {
            console.error('Error deleting user', error);
            if (axios.isAxiosError(error) && error.response?.status === 401) {
                toast.error(error.response.data.message);
            } else {
                toast.error('Error al eliminar usuario');
            }
        }
    };

    const handleUpdateMaxRequests = async (userId: string, newMax: number | null) => {
        try {
            const token = localStorage.getItem('auth_token');
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

            await axios.patch(`${backendUrl}/users/${userId}/max-requests`,
                { maxRequests: newMax },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setUsers(users.map(u => u.id === userId ? { ...u, maxRequests: newMax! } : u));
            toast.success(newMax === null ? 'Límite eliminado (Ilimitado)' : 'Límite actualizado');
        } catch (error) {
            console.error('Error updating max requests', error);
            toast.error('Error al actualizar límite');
        }
    };

    // Derived State - Users
    const totalPages = Math.ceil(users.length / itemsPerPage);
    const currentUsers = users.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
    };

    const handlePrevPage = () => {
        if (currentPage > 1) setCurrentPage(prev => prev - 1);
    };

    // Derived State - Requests (Modal)
    const totalPagesRequests = Math.ceil(userRequests.length / itemsPerPageRequests);
    const currentRequests = userRequests.slice(
        (currentPageRequests - 1) * itemsPerPageRequests,
        currentPageRequests * itemsPerPageRequests
    );

    const handleNextPageRequests = () => {
        if (currentPageRequests < totalPagesRequests) setCurrentPageRequests(prev => prev + 1);
    };

    const handlePrevPageRequests = () => {
        if (currentPageRequests > 1) setCurrentPageRequests(prev => prev - 1);
    };


    // Helper to check if user is protected (The Super Admin)
    const isSuperAdmin = (email: string) => email === 'davidzapata.dz051099@gmail.com';

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando usuarios...</div>;

    return (
        <div className="flex flex-col gap-3">
            <div className="divide-y divide-gray-100 bg-white rounded-lg border border-gray-100 shadow-sm">
                {currentUsers.map((u) => (
                    <div key={u.id} className="p-3 flex flex-col gap-3 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-3">
                                <div className="relative w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xs ring-2 ring-white shadow-sm overflow-hidden shrink-0">
                                    {u.avatar ? (
                                        <Image
                                            src={u.avatar}
                                            alt={u.name}
                                            fill
                                            className="object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                                (e.target as HTMLImageElement).nextElementSibling?.removeAttribute('hidden');
                                            }}
                                        />
                                    ) : (
                                        u.name.charAt(0).toUpperCase()
                                    )}
                                    <span hidden>{u.name.charAt(0).toUpperCase()}</span>
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="font-medium text-xs text-gray-900 leading-tight flex items-center gap-1.5 truncate">
                                        {u.name}
                                        {isSuperAdmin(u.email) && (
                                            <span className="text-[8px] bg-amber-100 text-amber-700 px-1 py-0 rounded-full font-bold border border-amber-200 shrink-0">
                                                MASTER
                                            </span>
                                        )}
                                    </span>
                                    <span className="text-[10px] text-gray-500 truncate">{u.email}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                                <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded-full ${u.role === 'admin' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                                    {u.role === 'admin' ? 'ADMIN' : 'USER'}
                                </span>
                                <div className={`w-2 h-2 rounded-full ${u.status === 'active' ? 'bg-green-500' : 'bg-red-400'}`} />
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-50">
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-[10px] gap-1.5 border-purple-100 text-purple-600 hover:bg-purple-50"
                                onClick={() => handleViewRequests(u)}
                            >
                                <ExternalLink className="w-3 h-3" />
                                {u.requestsCount !== undefined ? `${u.requestsCount} / ` : ''}
                                Ver Enlaces
                            </Button>

                            {!isSuperAdmin(u.email) && (
                                <div className="flex items-center gap-1 bg-gray-50 rounded-md px-2 py-0.5 border border-gray-100" title="Dejar vacío para ilimitado">
                                    <span className="text-[10px] text-gray-500 font-medium whitespace-nowrap">Límite:</span>
                                    <input
                                        type="number"
                                        min="0"
                                        className="w-8 bg-transparent text-center text-xs font-bold text-gray-700 focus:outline-none focus:ring-0 border-b border-transparent focus:border-purple-300 transition-colors placeholder-gray-300"
                                        placeholder="∞"
                                        defaultValue={u.maxRequests ?? ''}
                                        onBlur={(e) => {
                                            const val = e.target.value === '' ? null : parseInt(e.target.value);
                                            if (val !== u.maxRequests) {
                                                handleUpdateMaxRequests(u.id, val);
                                            }
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                const val = e.currentTarget.value === '' ? null : parseInt(e.currentTarget.value);
                                                if (val !== u.maxRequests) {
                                                    handleUpdateMaxRequests(u.id, val);
                                                    e.currentTarget.blur();
                                                }
                                            }
                                        }}
                                    />
                                </div>
                            )}

                            {!isSuperAdmin(u.email) && u.id !== users.find(me => me.email === localStorage.getItem('user_email'))?.id && (
                                <div className="flex items-center gap-1">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className={`h-7 w-7 ${u.status === 'active' ? 'text-red-400 hover:bg-red-50' : 'text-green-500 hover:bg-green-50'}`}
                                        onClick={() => toggleStatus(u.id, u.status)}
                                        title={u.status === 'active' ? 'Desactivar acceso' : 'Activar acceso'}
                                    >
                                        {u.status === 'active' ? (
                                            <Ban className="w-3.5 h-3.5" />
                                        ) : (
                                            <Check className="w-3.5 h-3.5" />
                                        )}
                                    </Button>

                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className={`h-7 w-7 ${u.role === 'admin' ? 'text-amber-500 hover:bg-amber-50' : 'text-blue-500 hover:bg-blue-50'}`}
                                        onClick={() => toggleRole(u.id, u.role)}
                                        title={u.role === 'admin' ? 'Quitar Admin' : 'Hacer Admin'}
                                    >
                                        <span className="text-[10px] font-bold">{u.role === 'admin' ? '↓' : '↑'}</span>
                                    </Button>

                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-7 w-7 text-red-300 hover:bg-red-50 hover:text-red-600"
                                        onClick={() => handleDeleteUser(u.id)}
                                        title="Eliminar Usuario"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {totalPages > 1 && (
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
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent id="admin-user-requests-modal" className="w-[50vw] min-w-[600px] max-w-[800px] max-h-[90vh] flex flex-col p-6 overflow-hidden sm:rounded-2xl gap-0">
                    <DialogHeader className="pb-4 shrink-0">
                        <DialogTitle className="flex items-center gap-2 text-purple-950 text-lg">
                            Enlaces de {selectedUserForRequests?.name} 💌
                        </DialogTitle>
                        <DialogDescription className="text-sm">
                            Lista de solicitudes creadas por este usuario.
                        </DialogDescription>
                    </DialogHeader>

                    {loadingRequests ? (
                        <div className="flex-1 flex items-center justify-center py-12 text-gray-500 animate-pulse">
                            Cargando enlaces...
                        </div>
                    ) : (
                        <div className="flex flex-col flex-1 overflow-hidden min-h-0">
                            <ScrollArea className="flex-1 -mr-4 pr-4">
                                <div className="space-y-3 pb-2 pt-1 pl-1">
                                    {userRequests.length === 0 ? (
                                        <div className="text-center py-12 text-gray-400 text-sm border-2 border-dashed border-gray-100 rounded-xl flex flex-col items-center justify-center gap-2 bg-gray-50/50">
                                            <span className="text-2xl">📭</span>
                                            <p>No hay enlaces creados aún.</p>
                                        </div>
                                    ) : (
                                        currentRequests.map((req) => (
                                            <div key={req.id} className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white border border-purple-100 rounded-xl hover:border-purple-300 transition-all shadow-sm">
                                                <div className="flex-1 min-w-0">
                                                    {editingRequestId === req.id ? (
                                                        <div className="flex items-start gap-3">
                                                            {/* Image on the left */}
                                                            <div className="relative group/img h-20 w-20 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center overflow-hidden shrink-0 shadow-sm transition-all hover:border-purple-300">
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
                                                                                className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transform hover:scale-110 transition-all active:scale-90"
                                                                                title="Eliminar foto"
                                                                            >
                                                                                <X className="w-3.5 h-3.5" />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex flex-col items-center gap-1">
                                                                        <Camera className="w-6 h-6 text-purple-300" />
                                                                        <span className="text-[7px] font-bold text-purple-400 uppercase">Subir</span>
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

                                                            {/* Content in the middle */}
                                                            <div className="flex-1 flex flex-col gap-2">
                                                                <div className="flex gap-2 items-center">
                                                                    <Input
                                                                        value={editName}
                                                                        onChange={(e) => setEditName(e.target.value)}
                                                                        className="h-9 text-sm font-semibold flex-1 px-3 rounded-lg border-gray-200"
                                                                        placeholder="Nombre"
                                                                    />
                                                                    <select
                                                                        value={editOccasionId}
                                                                        onChange={(e) => setEditOccasionId(e.target.value)}
                                                                        className="h-9 text-xs border-gray-200 border rounded-lg px-3 bg-white text-gray-600 focus:ring-1 focus:ring-purple-200 cursor-pointer w-40 font-medium"
                                                                    >
                                                                        {occasions.map(occ => (
                                                                            <option key={occ.id} value={occ.id}>
                                                                                {occ.name}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                                <textarea
                                                                    value={editMessage}
                                                                    onChange={(e) => setEditMessage(e.target.value)}
                                                                    className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2 h-20 resize-y focus:ring-1 focus:ring-purple-200 text-gray-700 leading-normal"
                                                                    placeholder="Escribe tu mensaje..."
                                                                />
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-2">
                                                                        <input
                                                                            type="checkbox"
                                                                            id={`anon-admin-${req.id}`}
                                                                            checked={editIsAnonymous}
                                                                            onChange={(e) => setEditIsAnonymous(e.target.checked)}
                                                                            className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                                        />
                                                                        <label htmlFor={`anon-admin-${req.id}`} className="text-xs font-medium text-gray-500">
                                                                            Enviar como anónimo
                                                                        </label>
                                                                    </div>
                                                                    <div className="flex gap-1.5">
                                                                        <button
                                                                            className={`px-3 py-1 text-[11px] rounded-full border transition-all active:scale-95 ${editAffection === 'te_quiero' ? 'bg-pink-50 text-pink-600 border-pink-100 font-bold' : 'text-gray-400 border-gray-100 hover:border-pink-100 bg-white'}`}
                                                                            onClick={() => setEditAffection('te_quiero')}
                                                                        >
                                                                            Te Quiero
                                                                        </button>
                                                                        <button
                                                                            className={`px-3 py-1 text-[11px] rounded-full border transition-all active:scale-95 ${editAffection === 'te_amo' ? 'bg-purple-50 text-purple-600 border-purple-100 font-bold' : 'text-gray-400 border-gray-100 hover:border-purple-100 bg-white'}`}
                                                                            onClick={() => setEditAffection('te_amo')}
                                                                        >
                                                                            Te Amo
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Vertical Action buttons column on the right */}
                                                            <div className="flex flex-col gap-1.5 shrink-0">
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className="h-9 w-9 text-green-500 hover:bg-green-50 hover:text-green-600 rounded-lg border-2 border-green-50 hover:border-green-100 bg-white shadow-sm flex items-center justify-center"
                                                                    onClick={() => handleUpdateAdmin(req.id)}
                                                                    title="Guardar"
                                                                >
                                                                    <Save className="w-4 h-4" />
                                                                </Button>
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className="h-9 w-9 text-gray-400 hover:bg-gray-50 hover:text-gray-500 rounded-lg border-2 border-gray-50 hover:border-gray-100 bg-white shadow-sm flex items-center justify-center"
                                                                    onClick={() => setEditingRequestId(null)}
                                                                    title="Cancelar"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-2">
                                                                <h3 className="font-semibold text-sm text-gray-900 truncate max-w-[150px]">{req.partnerName}</h3>
                                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold tracking-tight shrink-0 ${req.response === 'yes' ? 'bg-green-100 text-green-700' : req.response === 'no' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                                                                    {req.response === 'yes' ? 'SÍ' : req.response === 'no' ? 'NO' : 'PENDIENTE'}
                                                                </span>
                                                                {req.occasion && (
                                                                    <span
                                                                        className="text-[10px] px-2 py-0.5 rounded-full font-medium border shrink-0"
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
                                                                {req.message && <p className="text-xs text-gray-500 italic whitespace-pre-wrap line-clamp-2 leading-snug">&quot;{req.message}&quot;</p>}
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[10px] text-purple-400 border border-purple-100 px-2 py-0.5 rounded-full font-medium bg-purple-50/30">
                                                                        {req.affectionLevel === 'te_quiero' ? '🌸 Te Quiero' : '❤️ Te Amo'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <span className="text-[10px] text-gray-400 mt-1">📅 {new Date(req.createdAt).toLocaleDateString()}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {editingRequestId !== req.id && (
                                                    <div className="flex items-start gap-1 shrink-0 ml-auto">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                                            onClick={() => startEditRequest(req)}
                                                            title="Editar"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </Button>
                                                        <a
                                                            href={`/c/${req.slug}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-purple-500 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                                                            title="Abrir enlace"
                                                        >
                                                            <ExternalLink className="w-4 h-4" />
                                                        </a>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-red-300 hover:bg-red-50 hover:text-red-500"
                                                            onClick={() => handleDeleteRequest(req.id)}
                                                            title="Eliminar"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </ScrollArea>

                            {/* Pagination Controls - Fixed Bottom Footer */}
                            {totalPagesRequests > 1 && (
                                <div className="flex justify-center items-center gap-4 pt-4 mt-2 border-t border-gray-100 shrink-0 bg-white z-10">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 text-xs font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 px-3"
                                        onClick={handlePrevPageRequests}
                                        disabled={currentPageRequests === 1}
                                    >
                                        Anterior
                                    </Button>
                                    <span className="text-xs font-medium text-gray-600 min-w-[3rem] text-center">
                                        {currentPageRequests} / {totalPagesRequests}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 text-xs font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 px-3"
                                        onClick={handleNextPageRequests}
                                        disabled={currentPageRequests === totalPagesRequests}
                                    >
                                        Siguiente
                                    </Button>
                                </div>
                            )}
                        </div>
                    )
                    }
                </DialogContent >
            </Dialog >

            {/* CONFIRMATION DIALOG FOR REQUEST DELETION */}
            < Dialog open={!!requestToDelete} onOpenChange={(open) => !open && setRequestToDelete(null)}>
                <DialogContent overlayClassName="z-[99998]" className="max-w-xs sm:max-w-sm p-6 rounded-2xl bg-white shadow-xl z-[99999] overflow-hidden">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-purple-950 text-center">¿Estás seguro?</DialogTitle>
                        <DialogDescription className="text-center text-gray-500">
                            Esta acción eliminará el enlace permanentemente.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-3 mt-4">
                        <Button
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl h-11"
                            onClick={executeDeleteRequest}
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
            </Dialog >

            {/* CONFIRMATION DIALOG FOR USER DELETION */}
            < Dialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
                <DialogContent overlayClassName="z-[99998]" className="max-w-md p-6 rounded-2xl bg-white shadow-xl z-[99999] overflow-hidden">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-purple-950 text-center">¿Eliminar usuario?</DialogTitle>
                        <DialogDescription className="text-center text-gray-500">
                            Se borrarán todos sus enlaces y fotos. Esta acción es definitiva.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-3 mt-4">
                        <Button
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl h-11"
                            onClick={executeDeleteUser}
                        >
                            Eliminar permanentemente
                        </Button>
                        <Button
                            variant="ghost"
                            className="w-full text-gray-500 hover:bg-gray-50 hover:text-gray-800 rounded-xl h-11"
                            onClick={() => setUserToDelete(null)}
                        >
                            Cancelar
                        </Button>
                    </div>
                </DialogContent>
            </Dialog >
        </div >
    );
}
