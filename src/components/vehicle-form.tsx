'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Check, Send } from 'lucide-react';

const formSchema = z.object({
  plate: z.string().min(7, 'A placa deve ter no mínimo 7 caracteres.').max(8, 'A placa deve ter no máximo 8 caracteres.'),
  model: z.string().min(2, 'O modelo é obrigatório.'),
});

type FormValues = z.infer<typeof formSchema>;

export function VehicleForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      plate: '',
      model: '',
    },
  });

  async function onSubmit(data: FormValues) {
    setIsSubmitting(true);
    // Here you would typically send the data to your backend
    await new Promise((resolve) => setTimeout(resolve, 1500));
    console.log(data);
    setIsSubmitting(false);

    toast({
      title: 'Veículo Cadastrado!',
      description: `O veículo ${data.model} (${data.plate}) foi adicionado com sucesso.`,
      action: <Check className="h-5 w-5 text-green-500" />,
    });

    // Redirect to the vehicles list page after a short delay
    setTimeout(() => {
      router.push('/vehicles');
    }, 1000);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="plate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Placa</FormLabel>
              <FormControl>
                <Input placeholder="Ex: ABC-1234" {...field} />
              </FormControl>
              <FormDescription>
                A placa de identificação do veículo.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="model"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Modelo</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Fiat Fiorino" {...field} />
              </FormControl>
               <FormDescription>
                O modelo do veículo (ex: marca e nome).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
              Salvando...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Salvar Veículo
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}