'use client';

import { VehicleForm } from '@/components/vehicle-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { notFound } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth-context';
import type { Vehicle } from '@/lib/types';
import React from 'react';


function EditVehicleSkeleton() {
  return (
    <div className="w-full">
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-2 h-4 w-full max-w-md" />
        </CardHeader>
        <CardContent className="space-y-8 pt-6">
            <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
            </div>
             <div className="space-y-3">
                <Skeleton className="h-4 w-32" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Skeleton className="h-28 w-full" />
                    <Skeleton className="h-28 w-full" />
                    <Skeleton className="h-28 w-full" />
                    <Skeleton className="h-28 w-full" />
                </div>
            </div>
            <Skeleton className="h-10 w-36" />
        </CardContent>
      </Card>
    </div>
  )
}


export default function EditVehiclePage({ params }: { params: { id: string } }) {
  const { id } = React.use(params);
  const { firestore } = useFirebase();
  const { user } = useAuth();
  
  const vehicleRef = useMemoFirebase(
    () => (firestore && id ? doc(firestore, 'vehicles', id) : null),
    [firestore, id]
  );
  const { data: vehicle, isLoading } = useDoc<Vehicle>(vehicleRef);

  if (isLoading) {
    return <EditVehicleSkeleton />;
  }

  if (!vehicle) {
    notFound();
  }

  return (
    <div className="w-full">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Editar Veículo: {vehicle.plate}</CardTitle>
          <CardDescription>
            Altere os dados abaixo para atualizar as informações do veículo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VehicleForm vehicle={vehicle} />
        </CardContent>
      </Card>
    </div>
  );
}
