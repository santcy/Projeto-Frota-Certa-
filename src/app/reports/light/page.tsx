'use client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useCollection, WithId } from '@/firebase';
import { where, orderBy } from 'firebase/firestore';
import type { Vehicle, Checklist } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { CHECKLIST_ITEMS_SECTIONS_LEVE, CHECKLIST_ITEMS_LEVE } from '@/lib/types';
import { useAuth } from '@/context/auth-context';

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}


export default function ReportsLightPage() {
  const { user } = useAuth();

  const { data: checklists, isLoading: isLoadingChecklists } =
    useCollection<Checklist>(
      'checklists', 
      where('checklistType', '==', 'leve'),
      orderBy('date', 'desc')
    );

  const { data: vehicles, isLoading: isLoadingVehicles } =
    useCollection<Vehicle>('vehicles');

  const isLoading = isLoadingChecklists || isLoadingVehicles;

  if (user && user.role === 'driver') {
    return (
      <div className="mx-auto w-full max-w-7xl">
          <Card>
              <CardHeader>
                  <CardTitle>Acesso Negado</CardTitle>
                  <CardContent>
                      <p className="mt-4">Você não tem permissão para acessar esta página.</p>
                  </CardContent>
              </CardHeader>
          </Card>
      </div>
    )
  }

  const handleDownloadChecklist = (checklist: WithId<Checklist>, vehicle: WithId<Vehicle>) => {
    const doc = new jsPDF() as jsPDFWithAutoTable;

    doc.setFontSize(18);
    doc.text('ROTA CERTA - Relatório de Checklist (Frota Leve)', 14, 22);
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

    // Add photos
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
        if (photoY > 220) { // check for page break
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
        photoY += 75; // Y position for next image
      }
    });


    doc.save(`checklist-leve-${vehicle.plate}-${checklist.id.substring(0, 5)}.pdf`);
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Histórico de Checklist (Frota Leve)
        </h1>
        <p className="text-muted-foreground">
          Visualize o histórico completo de checklists da frota de veículos leves.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todos os Registros (Frota Leve)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Motorista</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Odômetro</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Skeleton className="h-5 w-32" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-24" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-28" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-16" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-20" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-24" />
                        </TableCell>
                        <TableCell className="text-right">
                          <Skeleton className="h-8 w-8 ml-auto" />
                        </TableCell>
                      </TableRow>
                    ))
                  : checklists && checklists.length > 0 ? (
                    checklists.map((checklist) => {
                      const vehicle = vehicles?.find(
                        (v) => v.id === checklist.vehicleId
                      );
                      const hasIssues = Object.values(checklist.items).some(
                        status => ['Avariado', 'issue', 'Incompleto', 'Desgastado'].includes(String(status))
                      );

                      return (
                        <TableRow key={checklist.id}>
                          <TableCell>
                            {checklist.date.toDate().toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })}
                          </TableCell>
                          <TableCell className="font-medium">
                            {vehicle?.plate || 'N/A'}
                          </TableCell>
                          <TableCell>{checklist.driverName}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                checklist.type === 'Saída'
                                  ? 'outline'
                                  : 'secondary'
                              }
                            >
                              {checklist.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {checklist.odometer.toLocaleString('pt-BR')} km
                          </TableCell>
                          <TableCell>
                            <Badge variant={hasIssues ? 'destructive' : 'default'}>
                              {hasIssues ? 'Com Problemas' : 'OK'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {vehicle && (
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleDownloadChecklist(checklist, vehicle)}
                                >
                                  <Download className="h-4 w-4" />
                                  <span className="sr-only">Baixar PDF</span>
                                </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })) : (
                        <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center">
                                Nenhum checklist encontrado.
                            </TableCell>
                        </TableRow>
                    )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
