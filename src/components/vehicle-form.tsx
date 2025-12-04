'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, doc } from 'firebase/firestore';

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
import { useFirebase, setDocumentNonBlocking } from '@/firebase';

const formSchema = z.object({
  plate: z
    .string()
    .min(7, 'A placa deve ter no mínimo 7 caracteres.')
    .max(8, 'A placa deve ter no máximo 8 caracteres.')
    .trim(),
  model: z.string().min(2, 'O modelo é obrigatório.').trim(),
  make: z.string().min(2, 'A marca é obrigatória.').trim(),
});

type FormValues = z.infer<typeof formSchema>;

export function VehicleForm() {
  const { toast } = useToast();
  const router = useRouter();
  const { firestore } = useFirebase();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      plate: '',
      model: '',
      make: '',
    },
  });

  async function onSubmit(data: FormValues) {
    if (!firestore) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Serviço de banco de dados indisponível.',
      });
      return;
    }

    setIsSubmitting(true);
    
    // Create a new document reference with a generated ID
    const vehicleRef = doc(collection(firestore, 'vehicles'));

    const newVehicle = {
      ...data,
      id: vehicleRef.id,
      status: 'Operacional',
      fuelLevel: 100,
      odometer: 0,
      image: `https://picsum.photos/seed/${vehicleRef.id}/400/300`,
    };

    setDocumentNonBlocking(vehicleRef, newVehicle, {});

    // Optimistic UI update
    toast({
      title: 'Veículo Cadastrado!',
      description: `O veículo ${data.model} (${data.plate}) foi adicionado com sucesso.`,
      action: <Check className="h-5 w-5 text-green-500" />,
    });

    setIsSubmitting(false);

    // Redirect to the vehicles list page after a short delay
    setTimeout(() => {
      router.push('/vehicles');
      router.refresh(); // Forces a refresh to show the new vehicle
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
          name="make"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Marca</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Fiat" {...field} />
              </FormControl>
              <FormDescription>A fabricante do veículo.</FormDescription>
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
                <Input placeholder="Ex: Fiorino" {...field} />
              </FormControl>
              <FormDescription>O modelo do veículo.</FormDescription>
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
