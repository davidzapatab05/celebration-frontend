'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Trash2, Copy, ExternalLink, RefreshCw } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';

interface Request {
    id: string;
    partnerName: string;
    slug: string;
    response: string;
    affectionLevel: string;
    createdAt: string;
    user: {
        name: string;
        email: string;
    };
}

export function AdminRequestsTab() {
    const [requests, setRequests] = useState<Request[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [requestToDelete, setRequestToDelete] = useState<string | null>(null);
    const ITEMS_PER_PAGE = 5;

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('auth_token');
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
            const response = await axios.get(`${backendUrl}/celebration/admin/all`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRequests(response.data);
        } catch (error) {
            console.error('Error fetching admin requests', error);
            toast.error('Error al cargar solicitudes');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const copyLink = (slug: string) => {
        const url = `${window.location.origin}/c/${slug}`;
        navigator.clipboard.writeText(url);
        toast.success('Enlace copiado al portapapeles 📋');
    };

    const confirmDelete = (id: string) => {
        setRequestToDelete(id);
    };

    const executeDelete = async () => {
        if (!requestToDelete) return;

        try {
            const token = localStorage.getItem('auth_token');
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

            await axios.delete(`${backendUrl}/celebration/admin/${requestToDelete}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success('Solicitud eliminada (Admin)');
            fetchRequests();
            setRequestToDelete(null);
        } catch (error) {
            console.error('Error deleting request', error);
            toast.error('Error al eliminar');
        }
    };

    const totalPages = Math.ceil(requests.length / ITEMS_PER_PAGE);
    const paginatedRequests = requests.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-purple-500" /></div>;
    }

    return (
        <Card className="shadow-sm border-purple-200">
            <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-lg text-purple-950">Gestión de Enlaces (Global) 🌐</CardTitle>
                    <CardDescription className="text-xs">Visualiza y gestiona todos los enlaces creados por usuarios.</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={fetchRequests} title="Actualizar">
                    <RefreshCw className="w-4 h-4 text-gray-500" />
                </Button>
            </CardHeader>
            <CardContent className="px-4 pb-4">
                <div className="rounded-md border border-purple-100 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-purple-50/50">
                            <TableRow>
                                <TableHead className="w-[100px] text-xs font-semibold text-purple-700">Usuario</TableHead>
                                <TableHead className="text-xs font-semibold text-purple-700">Para</TableHead>
                                <TableHead className="text-xs font-semibold text-purple-700">Estado</TableHead>
                                <TableHead className="text-right text-xs font-semibold text-purple-700">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedRequests.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-gray-500 text-sm">
                                        No hay solicitudes registradas.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedRequests.map((req) => (
                                    <TableRow key={req.id} className="hover:bg-purple-50/30 transition-colors">
                                        <TableCell className="font-medium text-xs text-gray-700">
                                            <div className="flex flex-col">
                                                <span>{req.user?.name}</span>
                                                <span className="text-[10px] text-gray-400">{req.user?.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs text-gray-600">{req.partnerName}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={`text-[10px] px-1.5 py-0 ${req.response === 'yes'
                                                    ? 'bg-green-50 text-green-600 border-green-200'
                                                    : req.response === 'rejected'
                                                        ? 'bg-red-50 text-red-600 border-red-200'
                                                        : 'bg-yellow-50 text-yellow-600 border-yellow-200'
                                                    }`}
                                            >
                                                {req.response === 'yes' ? 'Aceptado' : req.response === 'rejected' ? 'Rechazado' : 'Pendiente'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copyLink(req.slug)} title="Copiar Enlace">
                                                    <Copy className="w-3 h-3 text-gray-500" />
                                                </Button>
                                                <a href={`/c/${req.slug}`} target="_blank" rel="noreferrer">
                                                    <Button size="icon" variant="ghost" className="h-6 w-6" title="Ver">
                                                        <ExternalLink className="w-3 h-3 text-blue-500" />
                                                    </Button>
                                                </a>
                                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => confirmDelete(req.id)} title="Eliminar (Admin)">
                                                    <Trash2 className="w-3 h-3 text-red-500" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="h-7 text-xs"
                        >
                            Anterior
                        </Button>
                        <span className="text-xs flex items-center text-gray-500">
                            Página {page} de {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="h-7 text-xs"
                        >
                            Siguiente
                        </Button>
                    </div>
                )}
            </CardContent>

            {/* Confirmation Dialog */}
            <Dialog open={!!requestToDelete} onOpenChange={(open) => !open && setRequestToDelete(null)}>
                <DialogContent overlayClassName="z-[99998]" className="max-w-xs sm:max-w-sm p-6 rounded-2xl bg-white shadow-xl z-[99999] overflow-hidden">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-purple-950 text-center">¿Estás seguro?</DialogTitle>
                        <DialogDescription className="text-center text-gray-500">
                            No podrás revertir esto (Admin).
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
        </Card>
    );
}
