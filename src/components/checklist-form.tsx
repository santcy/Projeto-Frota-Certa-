'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useState, useEffect, useRef } from 'react';
import {
  collection,
  doc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  CHECKLIST_ITEMS_LEVE,
  CHECKLIST_ITEMS_SECTIONS_LEVE,
  LightVehicleChecklistItemStatus,
  Vehicle,
} from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Separator } from './ui/separator';
import { Check, Send, Camera, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { errorEmitter, FirestorePermissionError } from '@/firebase';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const lightChecklistItemsSchema = Object.values(CHECKLIST_ITEMS_LEVE)
  .flat()
  .reduce((acc, item) => {
    acc[item.id] = z.enum([
      "Em excelente estado",
      "Desgastado",
      "Incompleto",
      "Feito",
      "Pendente",
      "Avariado",
      "Manchado",
      "ok", 
      "issue", 
      "na"
    ]);
    return acc;
  }, {} as Record<string, z.ZodEnum<any>>);


const formSchema = z.object({
  driverName: z.string().min(3, 'O nome do motorista é obrigatório.'),
  vehicleId: z.string({ required_error: 'Selecione um veículo.' }),
  type: z.enum(['Saída', 'Retorno'], {
    required_error: 'Selecione o tipo de checklist.',
  }),
  odometer: z.coerce.number().min(1, 'O odômetro é obrigatório.'),
  fuelLevelPhotoUrl: z.string().url('É obrigatório tirar a foto do nível de combustível.'),
  kmPhotoUrl: z.string().url('É obrigatório tirar a foto do odômetro.'),
  enginePhotoUrl: z.string().url('É obrigatório tirar a foto do motor.'),
  leftSidePhotoUrl: z.string().url('É obrigatório tirar a foto da lateral esquerda.'),
  rightSidePhotoUrl: z.string().url('É obrigatório tirar a foto da lateral direita.'),
  frontPhotoUrl: z.string().url('É obrigatório tirar a foto da frente.'),
  backPhotoUrl: z.string().url('É obrigatório tirar a foto de trás.'),
  trunkPhotoUrl: z.string().url('É obrigatório tirar a foto da mala.'),
  items: z.object(lightChecklistItemsSchema),
  notes: z.string().optional(),
});


type FormValues = z.infer<typeof formSchema>;
type PhotoKey = 
  | 'fuelLevelPhotoUrl'
  | 'kmPhotoUrl'
  | 'enginePhotoUrl'
  | 'leftSidePhotoUrl'
  | 'rightSidePhotoUrl'
  | 'frontPhotoUrl'
  | 'backPhotoUrl'
  | 'trunkPhotoUrl';


const CameraCapture = ({
  onCapture,
  trigger,
}: {
  onCapture: (dataUrl: string) => void;
  trigger: React.ReactNode;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const { toast } = useToast();

  const handleOpen = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      setStream(mediaStream);
      setHasCameraPermission(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: 'Acesso à Câmera Negado',
        description: 'Por favor, habilite o acesso à câmera nas configurações do seu navegador.',
      });
    }
  };

  const handleClose = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUrl = canvas.toDataURL('image/jpeg');
        onCapture(dataUrl);
        handleClose();
      }
    }
  };

  return (
    <Dialog onOpenChange={(open) => (open ? handleOpen() : handleClose())}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Tirar Foto</DialogTitle>
        </DialogHeader>
        <div className="relative">
          {hasCameraPermission === false && (
             <Alert variant="destructive">
                <AlertTitle>Acesso à Câmera Necessário</AlertTitle>
                <AlertDescription>
                  Você precisa permitir o acesso à câmera para continuar.
                </AlertDescription>
              </Alert>
          )}
           <video
            ref={videoRef}
            className="w-full aspect-video rounded-md bg-muted"
            autoPlay
            playsInline
            muted
          />
          <canvas ref={canvasRef} className="hidden" />
        </div>
        <DialogClose asChild>
          <Button onClick={handleCapture} disabled={!hasCameraPermission}>
            <Camera className="mr-2 h-4 w-4" />
            Capturar Foto
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
};

const allLightItems = Object.values(CHECKLIST_ITEMS_LEVE).flat();
const allItemsMap = new Map(allLightItems.map(item => [item.id, item.label]));
const issueStatuses = ['Avariado', 'issue', 'Incompleto', 'Desgastado'];


export function ChecklistForm() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { firestore } = useFirebase();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const vehiclesQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'vehicles') : null),
    [firestore]
  );
  const { data: vehicles, isLoading: isLoadingVehicles } =
    useCollection<Vehicle>(vehiclesQuery);
    
  const defaultItems = Object.values(CHECKLIST_ITEMS_LEVE)
  .flat()
  .reduce((acc, item) => {
    // @ts-ignore
    acc[item.id] = item.statuses[0]; // Set default status
    return acc;
  }, {} as Record<string, LightVehicleChecklistItemStatus | 'ok' | 'issue' | 'na'>);
  

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      driverName: user?.name || '',
      items: defaultItems,
      notes: '',
    },
  });

  const photoFields: { key: PhotoKey; label: string }[] = [
    { key: 'fuelLevelPhotoUrl', label: 'Nível de Combustível' },
    { key: 'kmPhotoUrl', label: 'Odômetro (KM)' },
    { key: 'enginePhotoUrl', label: 'Motor' },
    { key: 'leftSidePhotoUrl', label: 'Lateral Esquerda' },
    { key: 'rightSidePhotoUrl', label: 'Lateral Direita' },
    { key: 'frontPhotoUrl', label: 'Frente' },
    { key: 'backPhotoUrl', label: 'Traseira' },
    { key: 'trunkPhotoUrl', label: 'Porta-malas' },
  ];

  async function onSubmit(data: FormValues) {
    if (!firestore || !user) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível conectar ao banco de dados. Tente novamente.',
      });
      return;
    }

    setIsSubmitting(true);
    const vehicle = vehicles?.find(v => v.id === data.vehicleId);
    if (!vehicle) {
        toast({ variant: 'destructive', title: 'Erro', description: 'Veículo não encontrado.'});
        setIsSubmitting(false);
        return;
    }

    try {
      const batch = writeBatch(firestore);
      const checklistRef = doc(collection(firestore, 'checklists'));
      
      const newChecklist = {
        ...data,
        id: checklistRef.id,
        userId: user.uid,
        driverName: data.driverName,
        date: serverTimestamp(),
        checklistType: 'leve' as 'pesada' | 'leve'
      };
      batch.set(checklistRef, newChecklist);

      const hasIssues = Object.values(data.items).some(status => issueStatuses.includes(String(status)));
      const vehicleRef = doc(firestore, 'vehicles', data.vehicleId);
      const vehicleUpdateData = {
        odometer: data.odometer,
        lastCheck: serverTimestamp(),
        status: hasIssues ? 'Com Problemas' : 'Operacional',
      };
      batch.update(vehicleRef, vehicleUpdateData);
      
      // Create maintenance requests for items with issues
      for (const [itemId, status] of Object.entries(data.items)) {
        if (issueStatuses.includes(String(status))) {
            const requestRef = doc(collection(firestore, 'maintenanceRequests'));
            const maintenanceRequest = {
                id: requestRef.id,
                vehicleId: data.vehicleId,
                checklistId: checklistRef.id,
                itemId: itemId,
                itemName: allItemsMap.get(itemId) || 'Item desconhecido',
                reportedStatus: String(status),
                requestStatus: 'Pendente',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                driverName: data.driverName,
                vehiclePlate: vehicle.plate,
                vehicleModel: vehicle.model,
            };
            batch.set(requestRef, maintenanceRequest);
        }
      }

      await batch.commit();

      toast({
        title: 'Checklist Enviado!',
        description: 'O checklist e as solicitações de manutenção foram registrados com sucesso.',
        action: <Check className="h-5 w-5 text-green-500" />,
      });
      
      form.reset({
        driverName: user?.name || '',
        vehicleId: '',
        type: undefined,
        odometer: 0,
        items: defaultItems,
        notes: '',
        fuelLevelPhotoUrl: undefined,
        kmPhotoUrl: undefined,
        enginePhotoUrl: undefined,
        leftSidePhotoUrl: undefined,
        rightSidePhotoUrl: undefined,
        frontPhotoUrl: undefined,
        backPhotoUrl: undefined,
        trunkPhotoUrl: undefined
      });

    } catch (error) {
      console.error('Error submitting checklist:', error);
      const permissionError = new FirestorePermissionError({
        path: 'batch-write',
        operation: 'write',
        requestResourceData: data,
      });
      errorEmitter.emit('permission-error', permissionError);

      toast({
        variant: 'destructive',
        title: 'Uh oh! Algo deu errado.',
        description: 'Não foi possível salvar o checklist. Verifique suas permissões e tente novamente.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <FormField
            control={form.control}
            name="driverName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Motorista</FormLabel>
                <FormControl>
                  <Input placeholder="Seu nome completo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="vehicleId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Veículo</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isLoadingVehicles}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingVehicles ? "Carregando..." : "Selecione a placa do veículo"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {vehicles?.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.plate} - {vehicle.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Checklist</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Saída ou Retorno" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Saída">Saída</SelectItem>
                  <SelectItem value="Retorno">Retorno</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="odometer"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Odômetro (km)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Ex: 123456" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Separator />

        <div className="space-y-6">
          <h3 className="text-lg font-medium">Fotos Obrigatórias</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {photoFields.map(({ key, label }) => (
              <FormField
                key={key}
                control={form.control}
                name={key}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{label}</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        {field.value ? (
                          <div className="relative w-full aspect-video rounded-md border bg-muted">
                            <Image
                              src={field.value}
                              alt={`Preview of ${label}`}
                              layout="fill"
                              objectFit="cover"
                              className="rounded-md"
                            />
                            <CameraCapture
                                onCapture={(dataUrl) => field.onChange(dataUrl)}
                                trigger={
                                    <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="absolute top-2 right-2 z-10 bg-background/70 hover:bg-background"
                                    >
                                    <RefreshCw className="h-4 w-4" />
                                    <span className="sr-only">Tirar outra foto</span>
                                    </Button>
                                }
                                />
                          </div>
                        ) : (
                          <CameraCapture
                            onCapture={(dataUrl) => field.onChange(dataUrl)}
                            trigger={
                               <Button type="button" variant="outline" className="w-full">
                                    <Camera className="mr-2 h-4 w-4" />
                                    Tirar Foto
                               </Button>
                            }
                          />
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>
        </div>

        <Separator />

        <h3 className="text-lg font-medium">Itens do Checklist</h3>
        <Accordion
          type="multiple"
          className="w-full"
          defaultValue={['pneus']}
        >
          {Object.entries(CHECKLIST_ITEMS_SECTIONS_LEVE).map(
            ([sectionKey, sectionName]) => (
              <AccordionItem value={sectionKey} key={sectionKey}>
                <AccordionTrigger>{sectionName}</AccordionTrigger>
                <AccordionContent className="pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                  {CHECKLIST_ITEMS_LEVE[
                    sectionKey as keyof typeof CHECKLIST_ITEMS_LEVE
                  ].map((item) => (
                    <FormField
                      key={item.id}
                      control={form.control}
                      name={`items.${item.id}`}
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>{item.label}</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                               <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um status" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {item.statuses.map(status => (
                                        <SelectItem key={status} value={status}>{status}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  ))}
                </AccordionContent>
              </AccordionItem>
            )
          )}
        </Accordion>

        <Separator />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descreva qualquer problema ou observação adicional..."
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Se algum item foi marcado com status de avaria ou pendência, detalhe aqui.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full md:w-auto"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
              Enviando...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Enviar Checklist
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
