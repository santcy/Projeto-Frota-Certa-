'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';

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
import { Check, Edit, Send } from 'lucide-react';
import { WithId } from '@/firebase';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import { Label } from './ui/label';
import type { Vehicle } from '@/lib/types';
import { db } from '@/firebase/config';


const formSchema = z.object({
  plate: z
    .string()
    .min(7, 'A placa deve ter no mínimo 7 caracteres.')
    .max(8, 'A placa deve ter no máximo 8 caracteres.')
    .trim(),
  make: z.string().min(2, 'A marca é obrigatória.').trim(),
  model: z.string().min(2, 'O modelo é obrigatório.').trim(),
  image: z.string().url('Selecione uma imagem válida.'),
});

type FormValues = z.infer<typeof formSchema>;

const vehicleImages = PlaceHolderImages.filter(img => img.imageHint.includes('van'));

interface VehicleFormProps {
  vehicle?: WithId<Vehicle>;
}

export function VehicleForm({ vehicle }: VehicleFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const isEditing = !!vehicle;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      plate: '',
      model: '',
      make: '',
      image: vehicleImages[0]?.imageUrl || '',
    },
  });

  useEffect(() => {
    if (vehicle) {
      form.reset({
        plate: vehicle.plate,
        make: vehicle.make,
        model: vehicle.model,
        image: vehicle.image || vehicleImages[0]?.imageUrl || '',
      });
    }
  }, [vehicle, form]);

  async function onSubmit(data: FormValues) {
    setIsSubmitting(true);

    try {
        if (isEditing) {
          // Update existing vehicle
          const vehicleRef = doc(db, 'vehicles', vehicle.id);
          await updateDoc(vehicleRef, data);
           toast({
            title: 'Veículo Atualizado!',
            description: `O veículo ${data.plate} foi atualizado com sucesso.`,
            action: <Check className="h-5 w-5 text-green-500" />,
          });
          setTimeout(() => {
            router.push(`/vehicles/${vehicle.id}`);
            router.refresh();
          }, 1000);

        } else {
          // Create new vehicle
          const vehicleRef = doc(collection(db, 'vehicles'));
          const newVehicle = {
            ...data,
            id: vehicleRef.id,
            status: 'Operacional',
            fuelLevel: 100,
            odometer: 0,
          };

          await setDoc(vehicleRef, newVehicle);
           toast({
            title: 'Veículo Cadastrado!',
            description: `O veículo ${data.plate} foi adicionado com sucesso.`,
            action: <Check className="h-5 w-5 text-green-500" />,
          });
           setTimeout(() => {
            router.push('/vehicles');
            router.refresh();
          }, 1000);
        }
    } catch(error) {
        console.error("Error saving vehicle:", error);
        toast({
            variant: "destructive",
            title: "Erro ao salvar veículo",
            description: "Ocorreu um erro ao salvar os dados do veículo. Tente novamente."
        })
    } finally {
        setIsSubmitting(false);
    }
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
                  className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
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
             {isEditing ? <Edit className="mr-2 h-4 w-4" /> : <Send className="mr-2 h-4 w-4" />}
             {isEditing ? 'Salvar Alterações' : 'Cadastrar Veículo'}
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
