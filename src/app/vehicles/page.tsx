'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  useCollection,
  useFirebase,
  useMemoFirebase,
  WithId,
} from '@/firebase';
import { collection, orderBy, query } from 'firebase/firestore';
import type { Vehicle, VehicleStatus } from '@/lib/types';
import { ArrowRight, Fuel, Gauge, PlusCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth-context';

function getStatusVariant(status?: VehicleStatus) {
  switch (status) {
    case 'Operacional':
      return 'default';
    case 'Com Problemas':
      return 'destructive';
    case 'Manutenção':
      return 'secondary';
    default:
      return 'outline';
  }
}

function VehicleCard({
  vehicle,
}: {
  vehicle: WithId<Vehicle>;
}) {
  return (
    <Card className="flex flex-col overflow-hidden">
      <CardHeader className="p-0">
        <Image
          src={vehicle.image || 'https://picsum.photos/seed/van/400/300'}
          alt={vehicle.model}
          width={400}
          height={300}
          className="aspect-[4/3] w-full object-cover transition-transform hover:scale-105"
          data-ai-hint="white van"
        />
      </CardHeader>
      <CardContent className="flex-1 p-4">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{vehicle.plate}</CardTitle>
          <Badge variant={getStatusVariant(vehicle.status)}>
            {vehicle.status}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{vehicle.model}</p>
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Gauge className="h-4 w-4 text-muted-foreground" />
            <span>{vehicle.odometer.toLocaleString('pt-BR')} km</span>
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex items-center gap-2">
              <Fuel className="h-4 w-4 text-muted-foreground" />
              <span>Nível de Combustível</span>
              <span className="ml-auto font-semibold">{vehicle.fuelLevel}%</span>
            </div>
            <Progress value={vehicle.fuelLevel} className="h-2" />
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button asChild className="w-full">
          <Link href={`/vehicles/${vehicle.id}`}>
            Ver Detalhes <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

function VehicleCardSkeleton() {
    return (
        <Card className="flex flex-col overflow-hidden">
            <CardHeader className="p-0">
                <Skeleton className="aspect-[4/3] w-full" />
            </CardHeader>
            <CardContent className="flex-1 p-4 space-y-3">
                <div className="flex items-start justify-between">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-20" />
                </div>
                <Skeleton className="h-4 w-32" />
                <div className="mt-4 space-y-4 pt-2">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4 rounded-full" />
                        <Skeleton className="h-4 w-28" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4 rounded-full" />
                        <Skeleton className="h-4 w-20" />
                    </div>
                     <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-4 rounded-full" />
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-8 ml-auto" />
                        </div>
                        <Skeleton className="h-2 w-full" />
                    </div>
                </div>
            </CardContent>
            <CardFooter className="p-4 pt-0">
                <Skeleton className="h-10 w-full" />
            </CardFooter>
        </Card>
    )
}

export default function VehiclesPage() {
  const { firestore } = useFirebase();
  const { user, isUserLoading: isAuthLoading } = useAuth();

  const vehiclesQuery = useMemoFirebase(
    () =>
      firestore && user
        ? query(collection(firestore, 'vehicles'), orderBy('plate', 'asc'))
        : null,
    [firestore, user]
  );
  const { data: vehicles, isLoading: isLoadingVehicles } =
    useCollection<Vehicle>(vehiclesQuery);
    
  const isLoading = isLoadingVehicles || isAuthLoading;

  return (
    <div className="mx-auto w-full max-w-7xl flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Frota de Veículos</h1>
        <Button asChild className='w-full sm:w-auto'>
          <Link href="/vehicles/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Cadastrar Veículo
          </Link>
        </Button>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <VehicleCardSkeleton key={i} />
            ))
          : vehicles?.map((vehicle) => {
              return (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                />
              );
            })}
      </div>
    </div>
  );
}
