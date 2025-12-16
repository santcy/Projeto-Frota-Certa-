'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useState, useEffect, useRef } from 'react';
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
import { Check, Edit, Camera, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import type { AppUser } from '@/context/auth-context';
import { useAuth as useFirebaseAuth } from '@/firebase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
        video: { facingMode: 'user' }, // Use a câmera frontal
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
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>Tirar Foto de Perfil</DialogTitle>
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
            className="w-full aspect-square rounded-full object-cover bg-muted"
            autoPlay
            playsInline
            muted
          />
          <canvas ref={canvasRef} className="hidden" />
        </div>
        <DialogClose asChild>
          <Button onClick={handleCapture} disabled={!hasCameraPermission} className="w-full">
            <Camera className="mr-2 h-4 w-4" />
            Capturar Foto
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
};


const formSchema = z.object({
  name: z.string().min(2, 'O nome é obrigatório.').trim(),
  email: z.string().email(),
});

type FormValues = z.infer<typeof formSchema>;


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
    },
  });

  useEffect(() => {
    form.reset({
      name: user.name || '',
      email: user.email || '',
    });
  }, [user, form]);
  
  const handlePhotoUpdate = async (photoDataUrl: string) => {
    if (!auth.currentUser) return;
    setIsSubmitting(true);
    try {
        await updateProfile(auth.currentUser, {
            photoURL: photoDataUrl,
        });
        toast({
            title: 'Foto de Perfil Atualizada!',
            action: <Check className="h-5 w-5 text-green-500" />,
        });
        router.refresh();
    } catch (error: any) {
         toast({
            variant: 'destructive',
            title: 'Erro ao atualizar foto',
            description: error.message,
        });
    } finally {
        setIsSubmitting(false);
    }
  }

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
      });

      toast({
        title: 'Nome Atualizado!',
        description: `Suas informações foram salvas com sucesso.`,
        action: <Check className="h-5 w-5 text-green-500" />,
      });
      
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
        <div className='flex flex-col items-center gap-4'>
            <div className="relative h-32 w-32">
                <Image
                    src={user.firebaseUser.photoURL || `https://avatar.vercel.sh/${user.email}.png`}
                    alt="Foto de perfil"
                    width={128}
                    height={128}
                    className="aspect-square w-full rounded-full object-cover border-2 border-primary"
                />
                 <CameraCapture
                    onCapture={handlePhotoUpdate}
                    trigger={
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="absolute bottom-0 right-0 rounded-full"
                        >
                            <Camera className="h-4 w-4" />
                            <span className="sr-only">Alterar foto</span>
                        </Button>
                    }
                />
            </div>
             <FormDescription>
                Clique na câmera para tirar uma nova foto.
            </FormDescription>
        </div>
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
