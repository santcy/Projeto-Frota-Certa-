'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useState } from 'react';
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
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  CHECKLIST_ITEMS,
  CHECKLIST_ITEMS_SECTIONS,
  ChecklistItemStatus,
  Vehicle,
} from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Separator } from './ui/separator';
import { Check, Send } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { errorEmitter, FirestorePermissionError } from '@/firebase';

const checklistItemsSchema = Object.values(CHECKLIST_ITEMS)
  .flat()
  .reduce((acc, item) => {
    acc[item.id] = z.enum(['ok', 'issue', 'na']);
    return acc;
  }, {} as Record<string, z.ZodEnum<['ok', 'issue', 'na']>>);

const formSchema = z.object({
  driverName: z.string().min(3, 'O nome do motorista é obrigatório.'),
  vehicleId: z.string({ required_error: 'Selecione um veículo.' }),
  type: z.enum(['Saída', 'Retorno'], {
    required_error: 'Selecione o tipo de checklist.',
  }),
  odometer: z.coerce.number().min(1, 'O odômetro é obrigatório.'),
  fuelLevel: z.number().min(0).max(100),
  items: z.object(checklistItemsSchema),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

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

  const defaultItems = Object.values(CHECKLIST_ITEMS)
    .flat()
    .reduce((acc, item) => {
      acc[item.id] = 'ok';
      return acc;
    }, {} as Record<string, ChecklistItemStatus>);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      driverName: user?.name || '',
      fuelLevel: 50,
      items: defaultItems,
      notes: '',
    },
  });

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

    try {
      const batch = writeBatch(firestore);

      // 1. Create the new checklist document
      const checklistRef = doc(collection(firestore, 'checklists'));
      const hasIssues = Object.values(data.items).includes('issue');
      
      const newChecklist = {
        ...data,
        id: checklistRef.id,
        userId: user.uid,
        driverName: data.driverName, // Already in form data
        date: serverTimestamp(), // Use server timestamp
      };
      batch.set(checklistRef, newChecklist);

      // 2. Update the corresponding vehicle document
      const vehicleRef = doc(firestore, 'vehicles', data.vehicleId);
      const vehicleUpdateData = {
        odometer: data.odometer,
        fuelLevel: data.fuelLevel,
        lastCheck: serverTimestamp(),
        status: hasIssues ? 'Com Problemas' : 'Operacional',
      };
      batch.update(vehicleRef, vehicleUpdateData);

      // Commit the batch
      await batch.commit();

      toast({
        title: 'Checklist Enviado!',
        description: 'O checklist foi registrado com sucesso.',
        action: <Check className="h-5 w-5 text-green-500" />,
      });
      
      form.reset({
        driverName: user?.name || '',
        vehicleId: '',
        type: undefined,
        odometer: 0,
        fuelLevel: 50,
        items: defaultItems,
        notes: '',
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

        <h3 className="text-lg font-medium">Itens do Checklist</h3>
        <Accordion
          type="multiple"
          className="w-full"
          defaultValue={['iluminacao']}
        >
          {Object.entries(CHECKLIST_ITEMS_SECTIONS).map(
            ([sectionKey, sectionName]) => (
              <AccordionItem value={sectionKey} key={sectionKey}>
                <AccordionTrigger>{sectionName}</AccordionTrigger>
                <AccordionContent className="pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                  {CHECKLIST_ITEMS[
                    sectionKey as keyof typeof CHECKLIST_ITEMS
                  ].map((item) => (
                    <FormField
                      key={item.id}
                      control={form.control}
                      name={`items.${item.id}`}
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>{item.label}</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex items-center space-x-4"
                            >
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="ok" />
                                </FormControl>
                                <FormLabel className="font-normal">OK</FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="issue" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Problema
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="na" />
                                </FormControl>
                                <FormLabel className="font-normal">N/A</FormLabel>
                              </FormItem>
                            </RadioGroup>
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
          name="fuelLevel"
          render={({ field: { onChange, ...field } }) => (
            <FormItem>
              <FormLabel>Nível de Combustível ({field.value}%)</FormLabel>
              <FormControl>
                <Slider
                  value={[field.value]}
                  onValueChange={(value) => onChange(value[0])}
                  max={100}
                  step={5}
                />
              </FormControl>
            </FormItem>
          )}
        />

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
                Se algum item foi marcado como "Problema", detalhe aqui.
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
