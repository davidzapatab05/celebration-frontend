'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Lock, Heart, List, Users } from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreateCelebrationTab } from '@/components/dashboard/create-celebration-tab';
import { MyRequestsTab } from '@/components/dashboard/my-requests-tab';
import { AdminUsersTab } from '@/components/dashboard/admin-users-tab';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    hasAccess: boolean;
    avatar?: string;
    maxRequests: number | null;
}

interface CelebrationRequest {
    id: string;
    partnerName: string;
    message?: string;
    slug: string;
    response: string;
}

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loadingUser, setLoadingUser] = useState(true);
    const [requests, setRequests] = useState<CelebrationRequest[]>([]);

    useEffect(() => {
        const fetchUserAndRequests = async () => {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                router.push('/');
                return;
            }

            try {
                const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
                // Fetch User
                const userRes = await axios.get(`${backendUrl}/auth/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUser(userRes.data);

                // Fetch Requests
                if (userRes.data.hasAccess) {
                    await fetchRequests(token);
                }
            } catch (error) {
                console.error('Error fetching data', error);
                localStorage.removeItem('auth_token');
                router.push('/');
            } finally {
                setLoadingUser(false);
            }
        };

        fetchUserAndRequests();
    }, [router]);

    const fetchRequests = async (token: string) => {
        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
            const requestsRes = await axios.get(`${backendUrl}/celebration/mine/custom-all`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRequests(requestsRes.data);
        } catch (error) {
            console.error('Error fetching requests', error);
        }
    };

    const handleRefreshRequests = async () => {
        const token = localStorage.getItem('auth_token');
        if (token) await fetchRequests(token);
    };

    if (loadingUser) {
        return <div className="min-h-screen bg-purple-50 flex items-center justify-center text-purple-600 animate-pulse">Cargando...</div>;
    }

    if (user && !user.hasAccess) {
        return (
            <main className="min-h-screen bg-purple-50 flex flex-col items-center pt-20 p-4">
                <DashboardHeader user={user} />
                <Card className="w-full max-w-md shadow-lg border-purple-200 mt-10">
                    <CardHeader className="text-center">
                        <div className="mx-auto bg-purple-100 p-3 rounded-full w-fit mb-4">
                            <Lock className="w-8 h-8 text-purple-600" />
                        </div>
                        <CardTitle className="text-xl text-purple-950">Cuenta Pendiente</CardTitle>
                        <CardDescription>Tu cuenta está inactiva. Contacta al administrador para que habilite tu acceso.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center pb-6">
                        <Button
                            className="bg-purple-600 hover:bg-purple-700"
                            onClick={() => {
                                const message = encodeURIComponent(
                                    `Hola! Soy ${user.name} (${user.email}). Me gustaría solicitar acceso a la aplicación Celebra 🎉. ¿Podrías activar mi cuenta? ¡Gracias!`
                                );
                                window.open(`https://wa.me/51949325565?text=${message}`, '_blank');
                            }}
                        >
                            Contactar Admin
                        </Button>
                    </CardContent>
                </Card>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-purple-50 flex flex-col items-center pt-24 p-4">
            <DashboardHeader user={user} />

            <div className="w-full max-w-4xl">
                <Tabs
                    defaultValue="create"
                    className="w-full"
                    onValueChange={(value) => {
                        if (value === 'list') {
                            handleRefreshRequests();
                        }
                    }}
                >
                    <div className="w-full overflow-x-auto pb-4 scrollbar-hide">
                        <TabsList className="flex w-full min-w-max bg-white/80 backdrop-blur-sm border border-purple-100 p-1 h-auto gap-1 shadow-sm rounded-lg mb-0">
                            <TabsTrigger value="create" className="flex-1 gap-2 px-6 py-2 data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">
                                <Heart className="w-4 h-4" /> Crear
                            </TabsTrigger>
                            <TabsTrigger value="list" className="flex-1 gap-2 px-6 py-2 data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">
                                <List className="w-4 h-4" /> Mis Enlaces
                            </TabsTrigger>
                            {user?.role === 'admin' && (
                                <TabsTrigger value="admin" className="flex-1 gap-2 px-6 py-2 text-blue-600 data-[state=active]:text-blue-700 data-[state=active]:bg-blue-50">
                                    <Users className="w-4 h-4" /> Usuarios
                                </TabsTrigger>
                            )}
                        </TabsList>
                    </div>

                    <TabsContent value="create" className="max-w-md mx-auto mt-6">
                        <CreateCelebrationTab
                            onCreated={handleRefreshRequests}
                            user={user}
                            requestCount={requests.length}
                        />
                    </TabsContent>

                    <TabsContent value="list" className="max-w-2xl mx-auto mt-6">
                        <div className="bg-white/50 backdrop-blur-sm p-2 md:p-4 rounded-xl border border-purple-100">
                            <h2 className="text-xl font-bold text-purple-900 mb-4 text-center">Mis Enlaces Mágicos ({requests.length}) ✨</h2>
                            <MyRequestsTab requests={requests} setRequests={setRequests} />
                        </div>
                    </TabsContent>

                    {user?.role === 'admin' && (
                        <TabsContent value="admin" className="mt-6">
                            <div className="bg-white/50 backdrop-blur-sm p-2 md:p-4 rounded-xl border border-purple-100">
                                <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">Gestión de Usuarios (Admin) 👮‍♂️</h2>
                                <AdminUsersTab requestsCount={requests.length} />
                            </div>
                        </TabsContent>
                    )}
                </Tabs>
            </div>
        </main>
    );
}
