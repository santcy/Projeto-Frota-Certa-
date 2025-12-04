import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { vehicles } from '@/lib/data';
import type { VehicleStatus } from '@/lib/types';
import { ArrowRight, Fuel, Gauge, User } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

function getStatusVariant(status: VehicleStatus) {
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

export default function VehiclesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Frota de Veículos</h1>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {vehicles.map((vehicle) => (
          <Card key={vehicle.id} className="flex flex-col overflow-hidden">
            <CardHeader className="p-0">
              <Image
                src={vehicle.image}
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
                <Badge variant={getStatusVariant(vehicle.status)}>{vehicle.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{vehicle.model}</p>
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{vehicle.driver}</span>
                </div>
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
        ))}
      </div>
    </div>
  );
}
