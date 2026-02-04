'use client';

import { useState, useRef, useEffect } from 'react';
import { LogOut, User, Trash2, ChevronDown } from 'lucide-react';

import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import axios from 'axios';

interface User {
    name: string;
    email: string;
    role?: string;
    status?: string;
    avatar?: string;
}

interface DashboardHeaderProps {
    user: User | null;
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('auth_token');
        router.push('/');
    };

    const confirmDeleteAccount = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent closing menu immediately or bubbling
        // Security check: Super Admin cannot delete themselves via UI
        if (user?.email === 'davidzapata.dz051099@gmail.com') return;
        setIsMenuOpen(false);
        setIsDeleteModalOpen(true);
    };

    const executeDeleteAccount = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

            await axios.delete(`${backendUrl}/users/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success('Cuenta eliminada. ¡Esperamos que vuelvas pronto! 💔');
            setIsDeleteModalOpen(false);
            handleLogout();
        } catch (error) {
            console.error('Error deleting account', error);
            toast.error('No se pudo eliminar la cuenta. Inténtalo de nuevo.');
        }
    };

    if (!user) return null;

    return (
        <header className="w-full bg-white border-b border-purple-100 px-4 py-3 flex justify-between items-center fixed top-0 z-20 shadow-sm">
            <div className="flex items-center gap-2">
                <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Celebra 🎉
                </span>
            </div>

            <div className="relative" ref={menuRef}>
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center gap-3 p-1.5 pr-3 rounded-full hover:bg-purple-50/80 transition-all border border-transparent hover:border-purple-100"
                >
                    <Avatar className="h-9 w-9 border-2 border-purple-100">
                        <AvatarImage src={user.avatar || undefined} alt={user.name} />
                        <AvatarFallback className="bg-purple-100 text-purple-600 text-xs">
                            {user.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-end hidden sm:flex">
                        <span className="text-sm font-semibold text-gray-700 leading-none mb-0.5">{user.name}</span>
                        <div className="flex items-center gap-1">
                            {user.role === 'admin' ? (
                                <span className="text-[10px] bg-purple-100 text-purple-600 px-1.5 py-px rounded-full font-bold">ADMIN</span>
                            ) : user.status === 'active' ? (
                                <span className="text-[10px] bg-purple-100 text-purple-600 px-1.5 py-px rounded-full font-bold">USUARIO</span>
                            ) : (
                                <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-px rounded-full font-bold">PENDIENTE</span>
                            )}
                        </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                    <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-purple-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                        <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-3 mb-1">
                            <Avatar className="h-10 w-10 border border-purple-100">
                                <AvatarImage src={user.avatar} alt={user.name} />
                                <AvatarFallback className="bg-purple-50 text-purple-500">
                                    {user.name?.charAt(0) || 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                            </div>
                        </div>
                        <div className="p-1">
                            {user.email !== 'davidzapata.dz051099@gmail.com' && (
                                <button
                                    onClick={confirmDeleteAccount}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors group"
                                >
                                    <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                    Eliminar Cuenta
                                </button>
                            )}
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors mt-1 group"
                            >
                                <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                Cerrar Sesión
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Account Deletion Confirmation Dialog */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent overlayClassName="z-[99998]" className="max-w-md p-6 rounded-2xl bg-white shadow-xl z-[99999] overflow-hidden">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-purple-950 text-center">¿Eliminar tu cuenta? 😢</DialogTitle>
                        <DialogDescription className="text-center text-gray-500">
                            Esta acción es irreversible. Se borrarán todos tus enlaces y fotos permanentemente.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-3 mt-4">
                        <Button
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl h-11"
                            onClick={executeDeleteAccount}
                        >
                            Sí, eliminar mi cuenta
                        </Button>
                        <Button
                            variant="ghost"
                            className="w-full text-gray-500 hover:bg-gray-50 hover:text-gray-800 rounded-xl h-11"
                            onClick={() => setIsDeleteModalOpen(false)}
                        >
                            Cancelar
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </header>
    );
}
