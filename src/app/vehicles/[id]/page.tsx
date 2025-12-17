'use client';
import { notFound, useRouter } from 'next/navigation';
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
  CHECKLIST_ITEMS_LEVE,
  CHECKLIST_ITEMS_SECTIONS_LEVE,
  LightVehicleChecklistItemStatus,
  type Vehicle,
  type Checklist,
} from '@/lib/types';
import { CheckCircle2, XCircle, CircleSlash, Download, Edit } from 'lucide-react';
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
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Link from 'next/link';
import React from 'react';
import Image from 'next/image';

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

function getItemStatusIcon(status: LightVehicleChecklistItemStatus | 'ok' | 'issue' | 'na') {
  switch (status) {
    case 'ok':
    case 'Em excelente estado':
    case 'Feito':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'issue':
    case 'Avariado':
    case 'Incompleto':
    case 'Desgastado':
      return <XCircle className="h-4 w-4 text-destructive" />;
    case 'na':
    case 'Pendente':
    case 'Manchado':
      return <CircleSlash className="h-4 w-4 text-muted-foreground" />;
    default:
        return <CircleSlash className="h-4 w-4 text-muted-foreground" />;
  }
}

function VehicleDetailsSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div className="space-y-1">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-5 w-48" />
        </div>
        <Skeleton className="h-10 w-full sm:w-32" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-7 w-56" />
          <Skeleton className="mt-1 h-4 w-full max-w-sm" />
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
  const { id } = params;
  const { firestore } = useFirebase();
  const { user } = useAuth();
  const router = useRouter();

  const vehicleRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'vehicles', id) : null),
    [firestore, user, id]
  );
  const { data: vehicle, isLoading: isLoadingVehicle } =
    useDoc<Vehicle>(vehicleRef);

  const checklistsQuery = useMemoFirebase(
    () =>
      firestore && user
        ? query(
            collection(firestore, 'checklists'),
            where('vehicleId', '==', id),
            orderBy('date', 'desc')
          )
        : null,
    [firestore, user, id]
  );
  const { data: vehicleChecklists, isLoading: isLoadingChecklists } =
    useCollection<Checklist>(checklistsQuery);

  const handleDownloadChecklist = (checklist: WithId<Checklist>, vehicle: WithId<Vehicle>) => {
    const doc = new jsPDF() as jsPDFWithAutoTable;

    doc.setFontSize(18);
    doc.text('ROTA CERTA - Relatório de Checklist', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    
    const generalInfo = [
      ['Veículo:', `${vehicle.plate} - ${vehicle.model}`],
      ['Motorista:', checklist.driverName],
      ['Data:', checklist.date.toDate().toLocaleString('pt-BR')],
      ['Tipo:', checklist.type],
      ['Odômetro:', `${checklist.odometer.toLocaleString('pt-BR')} km`],
    ];

    doc.autoTable({
      startY: 30,
      head: [['INFORMAÇÕES GERAIS', '']],
      body: generalInfo,
      theme: 'striped',
      headStyles: { fillColor: [30, 58, 138] },
    });
    
    let finalY = (doc as any).lastAutoTable.finalY;

    const checklistBody = [];

    for (const [sectionKey, sectionName] of Object.entries(CHECKLIST_ITEMS_SECTIONS_LEVE)) {
      const sectionItems = CHECKLIST_ITEMS_LEVE[sectionKey as keyof typeof CHECKLIST_ITEMS_LEVE];
      const relevantItems = sectionItems.filter(item => checklist.items[item.id]);

      if (relevantItems.length > 0) {
        checklistBody.push([{ content: sectionName.toUpperCase(), colSpan: 2, styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } }]);
        for (const item of relevantItems) {
          const status = checklist.items[item.id];
          checklistBody.push([item.label, String(status).toUpperCase()]);
        }
      }
    }

    doc.autoTable({
      startY: finalY + 10,
      head: [['Item', 'Status']],
      body: checklistBody,
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 138] },
    });
    
    finalY = (doc as any).lastAutoTable.finalY;

    if (checklist.notes) {
      doc.autoTable({
        startY: finalY + 10,
        head: [['OBSERVAÇÕES']],
        body: [[checklist.notes]],
        theme: 'striped',
        headStyles: { fillColor: [30, 58, 138] },
      });
      finalY = (doc as any).lastAutoTable.finalY;
    }

    doc.addPage();
    doc.setFontSize(14);
    doc.text('Fotos do Checklist', 14, 20);
    
    const photos = [
      { title: 'Nível de Combustível', url: checklist.fuelLevelPhotoUrl },
      { title: 'Odômetro (KM)', url: checklist.kmPhotoUrl },
      { title: 'Motor', url: checklist.enginePhotoUrl },
      { title: 'Frente', url: checklist.frontPhotoUrl },
      { title: 'Traseira', url: checklist.backPhotoUrl },
      { title: 'Lado Esquerdo', url: checklist.leftSidePhotoUrl },
      { title: 'Lado Direito', url: checklist.rightSidePhotoUrl },
      { title: 'Porta-malas', url: checklist.trunkPhotoUrl },
    ];
    
    let photoY = 30;
    photos.forEach((photo) => {
      if (photo.url) {
        if (photoY > 220) { 
          doc.addPage();
          photoY = 20;
        }
        doc.setFontSize(12);
        doc.text(photo.title, 14, photoY);
        try {
          doc.addImage(photo.url, 'JPEG', 14, photoY + 5, 80, 60);
        } catch (e) {
          console.error(`Error adding image to PDF for ${photo.title}:`, e);
          doc.text('Erro ao carregar imagem', 14, photoY + 20);
        }
        photoY += 75; 
      }
    });

    doc.save(`checklist-${vehicle.plate}-${checklist.id.substring(0, 5)}.pdf`);
  };
    
  if (isLoadingVehicle || isLoadingChecklists) {
    return <VehicleDetailsSkeleton />;
  }
  
  if (!vehicle) {
    notFound();
  }

  const photoFields: { key: keyof Checklist; label: string }[] = [
    { key: 'fuelLevelPhotoUrl', label: 'Foto do Nível de Combustível' },
    { key: 'kmPhotoUrl', label: 'Foto do Odômetro' },
    { key: 'enginePhotoUrl', label: 'Foto do Motor' },
    { key: 'frontPhotoUrl', label: 'Frente do Veículo' },
    { key: 'backPhotoUrl', label: 'Traseira do Veículo' },
    { key: 'leftSidePhotoUrl', label: 'Lado Esquerdo' },
    { key: 'rightSidePhotoUrl', label: 'Lado Direito' },
    { key: 'trunkPhotoUrl', label: 'Foto do Porta-malas' },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
       <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className='space-y-1'>
          <h1 className="text-2xl font-bold tracking-tight">
            Detalhes do Veículo: {vehicle.plate}
          </h1>
          <p className="text-muted-foreground">{vehicle.model}</p>
        </div>
        <Button asChild className='w-full sm:w-auto'>
          <Link href={`/vehicles/${vehicle.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Editar Veículo
          </Link>
        </Button>
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
                    <div className="flex w-full items-center justify-between pr-4 gap-4">
                      <div className="flex items-center gap-2 sm:gap-4">
                        <Badge
                          variant={
                            checklist.type === 'Saída' ? 'outline' : 'default'
                          }
                        >
                          {checklist.type}
                        </Badge>
                        <div className="text-left">
                          <p className="font-medium text-sm sm:text-base">
                            {checklist.date
                              .toDate()
                              .toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric',
                              })}
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground">
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
                    <div className="space-y-6">
                      {checklist.notes && (
                        <div className="mb-4 rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-700/50">
                          <strong>Observações:</strong> {checklist.notes}
                        </div>
                      )}

                      <div>
                        <h4 className="mb-4 font-semibold text-lg">Itens Verificados</h4>
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                          {Object.entries(CHECKLIST_ITEMS_SECTIONS_LEVE).map(
                            ([sectionKey, sectionName]) => {
                              const sectionItems =
                                CHECKLIST_ITEMS_LEVE[
                                  sectionKey as keyof typeof CHECKLIST_ITEMS_LEVE
                                ];
                              const relevantItems = sectionItems.filter(
                                (item) => checklist.items[item.id]
                              );

                              if (relevantItems.length === 0) return null;

                              return (
                                <div key={sectionKey}>
                                  <h5 className="mb-2 font-semibold">
                                    {sectionName}
                                  </h5>
                                  <ul className="space-y-2">
                                    {relevantItems.map((item) => (
                                      <li
                                        key={item.id}
                                        className="flex items-center justify-between text-sm"
                                      >
                                        <span>{item.label}</span>
                                        {getItemStatusIcon(
                                          checklist.items[item.id] as LightVehicleChecklistItemStatus
                                        )}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              );
                            }
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="mb-4 font-semibold text-lg">Fotos</h4>
                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {photoFields.map(({ key, label }) => {
                                const photoUrl = checklist[key] as string | undefined;
                                return photoUrl ? (
                                <div key={key}>
                                    <p className="text-sm font-medium mb-2">{label}</p>
                                    <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
                                        <Image src={photoUrl} alt={label} layout="fill" objectFit="cover" />
                                    </div>
                                </div>
                                ) : null;
                            })}
                        </div>
                      </div>

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
