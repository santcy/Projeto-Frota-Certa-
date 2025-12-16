'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updateProfile } from 'firebase/auth';

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
import { Check, Edit } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import { Label } from './ui/label';
import type { AppUser } from '@/context/auth-context';
import { useAuth as useFirebaseAuth } from '@/firebase';


const formSchema = z.object({
  name: z.string().min(2, 'O nome é obrigatório.').trim(),
  email: z.string().email(),
  photoURL: z.string().url('Selecione uma imagem válida.'),
});

type FormValues = z.infer<typeof formSchema>;

const avatarImages = PlaceHolderImages.filter(img => img.imageHint.includes('avatar'));

interface ProfileFormProps {
  user: AppUser;
}

export function ProfileForm({ user }: ProfileFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const auth = useFirebaseAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user.name || '',
      email: user.email || '',
      photoURL: user.firebaseUser.photoURL || avatarImages[0]?.imageUrl || '',
    },
  });

  useEffect(() => {
    form.reset({
      name: user.name || '',
      email: user.email || '',
      photoURL: user.firebaseUser.photoURL || avatarImages[0]?.imageUrl || '',
    });
  }, [user, form]);

  async function onSubmit(data: FormValues) {
    if (!auth.currentUser) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Usuário não autenticado.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await updateProfile(auth.currentUser, {
        displayName: data.name,
        photoURL: data.photoURL,
      });

      toast({
        title: 'Perfil Atualizado!',
        description: `Suas informações foram salvas com sucesso.`,
        action: <Check className="h-5 w-5 text-green-500" />,
      });
      
      // We might need to refresh the auth context state. A page reload is the simplest way.
      router.refresh();

    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Erro ao atualizar perfil',
            description: error.message,
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder="Seu nome" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="Seu email" {...field} disabled />
              </FormControl>
               <FormDescription>
                O email não pode ser alterado.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="photoURL"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Foto de Perfil</FormLabel>
              <FormDescription>
                Selecione um avatar.
              </FormDescription>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4"
                >
                  {avatarImages.map((image) => (
                    <FormItem key={image.id} className="space-y-0">
                      <FormControl>
                        <div>
                          <RadioGroupItem value={image.imageUrl} id={image.id} className="peer sr-only" />
                          <Label
                            htmlFor={image.id}
                            className="block cursor-pointer rounded-full border-2 border-muted bg-popover hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                          >
                            <Image
                              src={image.imageUrl}
                              alt={image.description}
                              width={128}
                              height={128}
                              className="aspect-square w-full object-cover rounded-full"
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
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
              Salvando...
            </>
          ) : (
            <>
             <Edit className="mr-2 h-4 w-4" />
             Salvar Alterações
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
