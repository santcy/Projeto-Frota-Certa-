'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useState } from 'react';

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
import { vehicles } from '@/lib/data';
import { CHECKLIST_ITEMS, CHECKLIST_ITEMS_SECTIONS, ChecklistItemStatus } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Separator } from './ui/separator';
import { Check, Send } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

const checklistItemsSchema = Object.values(CHECKLIST_ITEMS)
  .flat()
  .reduce((acc, item) => {
    acc[item.id] = z.enum(['ok', 'issue', 'na']);
    return acc;
  }, {} as Record<string, z.ZodEnum<['ok', 'issue', 'na']>>);

const formSchema = z.object({
  driver: z.string().min(3, 'O nome do motorista é obrigatório.'),
  vehicleId: z.string({ required_error: 'Selecione um veículo.' }),
  type: z.enum(['Saída', 'Retorno'], { required_error: 'Selecione o tipo de checklist.' }),
  odometer: z.coerce.number().min(1, 'O odômetro é obrigatório.'),
  fuelLevel: z.number().min(0).max(100),
  items: z.object(checklistItemsSchema),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function ChecklistForm() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultItems = Object.values(CHECKLIST_ITEMS)
    .flat()
    .reduce((acc, item) => {
      acc[item.id] = 'ok';
      return acc;
    }, {} as Record<string, ChecklistItemStatus>);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      driver: user?.name || '',
      fuelLevel: 50,
      items: defaultItems,
      notes: '',
    },
  });

  async function onSubmit(data: FormValues) {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    console.log(data);
    setIsSubmitting(false);

    toast({
      title: 'Checklist Enviado!',
      description: 'O checklist foi registrado com sucesso.',
      action: <Check className="h-5 w-5 text-green-500" />,
    });
    form.reset({
      driver: user?.name || '',
      vehicleId: '',
      type: undefined,
      odometer: 0,
      fuelLevel: 50,
      items: defaultItems,
      notes: '',
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <FormField
            control={form.control}
            name="driver"
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a placa do veículo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {vehicles.map((vehicle) => (
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
        <Accordion type="multiple" className="w-full" defaultValue={['iluminacao']}>
          {Object.entries(CHECKLIST_ITEMS_SECTIONS).map(([sectionKey, sectionName]) => (
            <AccordionItem value={sectionKey} key={sectionKey}>
              <AccordionTrigger>{sectionName}</AccordionTrigger>
              <AccordionContent className="pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                {CHECKLIST_ITEMS[sectionKey as keyof typeof CHECKLIST_ITEMS].map((item) => (
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
                              <FormLabel className="font-normal">Problema</FormLabel>
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
          ))}
        </Accordion>

        <Separator />

        <FormField
          control={form.control}
          name="fuelLevel"
          render={({ field: { onChange, ...fieldProps } }) => (
            <FormItem>
              <FormLabel>Nível de Combustível ({fieldProps.value}%)</FormLabel>
              <FormControl>
                <Slider
                  {...fieldProps}
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

        <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting}>
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