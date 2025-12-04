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
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Label } from './ui/label';

const formSchema = z.object({
  plate: z
    .string()
    .min(7, 'A placa deve ter no mínimo 7 caracteres.')
    .max(8, 'A placa deve ter no máximo 8 caracteres.')
    .trim(),
  model: z.string().min(2, 'O modelo é obrigatório.').trim(),
  make: z.string().min(2, 'A marca é obrigatória.').trim(),
  image: z.string().url('Selecione uma imagem válida.'),
});

type FormValues = z.infer<typeof formSchema>;

const vehicleImages = PlaceHolderImages.filter(img => img.imageHint.includes('van'));

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
      image: vehicleImages[0]?.imageUrl || '',
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
        <FormField
          control={form.control}
          name="image"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Foto do Veículo</FormLabel>
              <FormDescription>
                Selecione uma imagem para o veículo.
              </FormDescription>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="grid grid-cols-2 md:grid-cols-4 gap-4"
                >
                  {vehicleImages.map((image) => (
                    <FormItem key={image.id} className="space-y-0">
                      <FormControl>
                        <div>
                          <RadioGroupItem value={image.imageUrl} id={image.id} className="peer sr-only" />
                          <Label
                            htmlFor={image.id}
                            className="block cursor-pointer rounded-md border-2 border-muted bg-popover hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                          >
                            <Image
                              src={image.imageUrl}
                              alt={image.description}
                              width={200}
                              height={150}
                              className="aspect-[4/3] w-full object-cover rounded-md"
                              data-ai-hint={image.imageHint}
                            />
                          </Label>
                        </div>
                      </FormControl>
                    </FormItem>
                  ))}
                </RadioGroup>
              </FormControl>
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
