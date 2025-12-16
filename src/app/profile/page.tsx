'use client';

import { ProfileForm } from '@/components/profile-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';

function ProfilePageSkeleton() {
    return (
        <Card className="w-full max-w-2xl">
            <CardHeader>
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64 mt-2" />
            </CardHeader>
            <CardContent className="space-y-8">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                </div>
                 <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-3">
                    <Skeleton className="h-4 w-24" />
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
                        <Skeleton className="h-24 w-24 rounded-full" />
                        <Skeleton className="h-24 w-24 rounded-full" />
                        <Skeleton className="h-24 w-24 rounded-full" />
                        <Skeleton className="h-24 w-24 rounded-full" />
                    </div>
                </div>
                <Skeleton className="h-10 w-32" />
            </CardContent>
        </Card>
    )
}


export default function ProfilePage() {
    const { user, isUserLoading } = useAuth();

    if (isUserLoading) {
        return (
            <div className="mx-auto w-full max-w-7xl flex justify-center">
                <ProfilePageSkeleton />
            </div>
        )
    }

    if (!user) {
        return (
             <div className="mx-auto w-full max-w-7xl flex justify-center">
                <Card>
                    <CardHeader>
                        <CardTitle>Usuário não encontrado</CardTitle>
                        <CardDescription>Faça login para ver seu perfil.</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

  return (
    <div className="mx-auto w-full max-w-7xl flex justify-center">
        <Card className="w-full max-w-2xl">
            <CardHeader>
                <CardTitle className="text-2xl">Seu Perfil</CardTitle>
                <CardDescription>
                    Gerencie suas informações e foto de perfil.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ProfileForm user={user} />
            </CardContent>
        </Card>
    </div>
  );
}
