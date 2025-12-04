'use client';
import { notFound } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CHECKLIST_ITEMS,
  CHECKLIST_ITEMS_SECTIONS,
  ChecklistItemStatus,
  type Vehicle,
  type Checklist,
} from '@/lib/types';
import { CheckCircle2, XCircle, CircleSlash, Download } from 'lucide-react';
import {
  useDoc,
  useCollection,
  useFirebase,
  useMemoFirebase,
  WithId,
} from '@/firebase';
import { useAuth } from '@/context/auth-context';
import { doc, collection, query, where, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

function getItemStatusIcon(status: ChecklistItemStatus) {
  switch (status) {
    case 'ok':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'issue':
      return <XCircle className="h-4 w-4 text-destructive" />;
    case 'na':
      return <CircleSlash className="h-4 w-4 text-muted-foreground" />;
  }
}

function VehicleDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-72" />
        <Skeleton className="mt-2 h-5 w-48" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-7 w-56" />
          <Skeleton className="mt-1 h-4 w-full" />
        </CardHeader>
        <CardContent className="space-y-2">
            {Array.from({length: 3}).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
            ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default function VehicleDetailPage({ params }: { params: { id: string } }) {
  const { firestore } = useFirebase();
  const { user } = useAuth();

  const vehicleRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'vehicles', params.id) : null),
    [firestore, user, params.id]
  );
  const { data: vehicle, isLoading: isLoadingVehicle } =
    useDoc<Vehicle>(vehicleRef);

  const checklistsQuery = useMemoFirebase(
    () =>
      firestore && user
        ? query(
            collection(firestore, 'checklists'),
            where('vehicleId', '==', params.id),
            orderBy('date', 'desc')
          )
        : null,
    [firestore, user, params.id]
  );
  const { data: vehicleChecklists, isLoading: isLoadingChecklists } =
    useCollection<Checklist>(checklistsQuery);

  const handleDownloadChecklist = (checklist: WithId<Checklist>, vehicle: WithId<Vehicle>) => {
    let content = `ROTA CERTA - Relatório de Checklist\n\n`;
    content += `-----------------------------------\n`;
    content += `INFORMAÇÕES GERAIS\n`;
    content += `-----------------------------------\n`;
    content += `Veículo: ${vehicle.plate} - ${vehicle.model}\n`;
    content += `Motorista: ${checklist.driverName}\n`;
    content += `Data: ${checklist.date.toDate().toLocaleString('pt-BR')}\n`;
    content += `Tipo: ${checklist.type}\n`;
    content += `Odômetro: ${checklist.odometer.toLocaleString('pt-BR')} km\n`;
    content += `Nível de Combustível: ${checklist.fuelLevel}%\n\n`;

    content += `-----------------------------------\n`;
    content += `ITENS DO CHECKLIST\n`;
    content += `-----------------------------------\n`;
    Object.entries(CHECKLIST_ITEMS_SECTIONS).forEach(([sectionKey, sectionName]) => {
      const sectionItems = CHECKLIST_ITEMS[sectionKey as keyof typeof CHECKLIST_ITEMS];
      const relevantItems = sectionItems.filter(item => checklist.items[item.id]);

      if (relevantItems.length > 0) {
        content += `\n${sectionName.toUpperCase()}\n`;
        relevantItems.forEach(item => {
          const status = checklist.items[item.id];
          content += `- ${item.label}: ${status.toUpperCase()}\n`;
        });
      }
    });

    if (checklist.notes) {
      content += `\n-----------------------------------\n`;
      content += `OBSERVAÇÕES\n`;
      content += `-----------------------------------\n`;
      content += `${checklist.notes}\n`;
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `checklist-${vehicle.plate}-${checklist.id.substring(0, 5)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
    
  if (isLoadingVehicle || isLoadingChecklists) {
    return <VehicleDetailsSkeleton />;
  }
  
  if (!vehicle) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Detalhes do Veículo: {vehicle.plate}
        </h1>
        <p className="text-muted-foreground">{vehicle.model}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Checklists</CardTitle>
          <CardDescription>
            Veja todos os checklists de saída e retorno para este veículo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {vehicleChecklists && vehicleChecklists.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {vehicleChecklists.map((checklist) => (
                <AccordionItem value={checklist.id} key={checklist.id}>
                  <AccordionTrigger>
                    <div className="flex w-full items-center justify-between pr-4">
                      <div className="flex items-center gap-4">
                        <Badge
                          variant={
                            checklist.type === 'Saída' ? 'outline' : 'default'
                          }
                        >
                          {checklist.type}
                        </Badge>
                        <div className="text-left">
                          <p className="font-medium">
                            {checklist.date
                              .toDate()
                              .toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric',
                              })}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            por {checklist.driverName}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground hidden md:block">
                        Odo. {checklist.odometer.toLocaleString('pt-BR')} km
                      </p>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-4">
                    <div className="space-y-4">
                      {checklist.notes && (
                        <div className="mb-4 rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-700/50">
                          <strong>Observações:</strong> {checklist.notes}
                        </div>
                      )}
                      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {Object.entries(CHECKLIST_ITEMS_SECTIONS).map(
                          ([sectionKey, sectionName]) => {
                            const sectionItems =
                              CHECKLIST_ITEMS[
                                sectionKey as keyof typeof CHECKLIST_ITEMS
                              ];
                            const relevantItems = sectionItems.filter(
                              (item) => checklist.items[item.id]
                            );

                            if (relevantItems.length === 0) return null;

                            return (
                              <div key={sectionKey}>
                                <h4 className="mb-2 font-semibold">
                                  {sectionName}
                                </h4>
                                <ul className="space-y-2">
                                  {relevantItems.map((item) => (
                                    <li
                                      key={item.id}
                                      className="flex items-center justify-between text-sm"
                                    >
                                      <span>{item.label}</span>
                                      {getItemStatusIcon(
                                        checklist.items[item.id]
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            );
                          }
                        )}
                      </div>
                      {user?.role === 'admin' && (
                        <div className="pt-4 flex justify-end">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDownloadChecklist(checklist, vehicle)}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Baixar Checklist
                          </Button>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              Nenhum checklist encontrado para este veículo.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
