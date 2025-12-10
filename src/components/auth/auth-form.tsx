'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth as useFirebaseAuth } from '@/firebase';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { setDoc, doc, getDocs, collection } from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

const signUpSchema = z.object({
  name: z.string().min(3, { message: 'O nome é obrigatório.' }),
  email: z.string().email({ message: 'Por favor, insira um email válido.' }),
  password: z
    .string()
    .min(6, { message: 'A senha deve ter pelo menos 6 caracteres.' }),
  userType: z.enum(['admin', 'driver'], {
    required_error: 'Selecione um tipo de perfil.',
  }),
});

const loginSchema = z.object({
  email: z.string().email({ message: 'Por favor, insira um email válido.' }),
  password: z.string().min(1, { message: 'A senha é obrigatória.' }),
});

type SignUpFormValues = z.infer<typeof signUpSchema>;
type LoginFormValues = z.infer<typeof loginSchema>;

async function createUserProfile(
  firestore: any,
  user: any,
  name: string,
  userType: 'admin' | 'driver'
) {
  const userRef = doc(firestore, 'users', user.uid);

  await setDoc(userRef, {
    id: user.uid,
    name: name,
    email: user.email,
    userType: userType,
  });
}

export function AuthForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const { toast } = useToast();
  const router = useRouter();
  const auth = useFirebaseAuth();
  const { firestore } = useFirebase();

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const signUpForm = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: '', email: '', password: '', userType: 'driver' },
  });

  const handleAuthError = (error: any) => {
    console.error('Authentication error:', error);
    let description = 'Ocorreu um erro. Tente novamente.';
    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        description = 'Email ou senha inválidos.';
        break;
      case 'auth/email-already-in-use':
        description = 'Este email já está em uso.';
        break;
      case 'auth/invalid-email':
        description = 'O email fornecido é inválido.';
        break;
    }
    toast({
      variant: 'destructive',
      title: 'Falha na autenticação',
      description,
    });
  };

  const onLogin = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      toast({
        title: 'Login bem-sucedido!',
        description: 'Você será redirecionado em breve.',
      });
      router.push('/dashboard');
    } catch (error) {
      handleAuthError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSignUp = async (data: SignUpFormValues) => {
    setIsSubmitting(true);
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Serviço de banco de dados indisponível.'});
      setIsSubmitting(false);
      return;
    }

    try {
      // Check if any user exists to determine if this is the first user
      const usersCollection = collection(firestore, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      const isFirstUser = usersSnapshot.empty;
      
      // If it's the first user, force role to admin
      const userType = isFirstUser ? 'admin' : data.userType;

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      await updateProfile(userCredential.user, { displayName: data.name });
      
      await createUserProfile(firestore, userCredential.user, data.name, userType);
      
      toast({
        title: 'Conta criada com sucesso!',
        description: `Seu perfil foi criado como ${userType === 'admin' ? 'Administrador' : 'Motorista'}. Você será redirecionado para o login.`,
      });
      
      setActiveTab('login');
      loginForm.setValue('email', data.email);

    } catch (error) {
      handleAuthError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as 'login' | 'signup')}
      className="w-full"
    >
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="login">Entrar</TabsTrigger>
        <TabsTrigger value="signup">Criar Conta</TabsTrigger>
      </TabsList>
      <TabsContent value="login">
        <Card>
          <CardHeader>
            <CardTitle>Bem-vindo de volta!</CardTitle>
            <CardDescription>
              Faça login para continuar gerenciando sua frota.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...loginForm}>
              <form
                onSubmit={loginForm.handleSubmit(onLogin)}
                className="space-y-4"
              >
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="seu@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Sua senha"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Entrando...' : 'Entrar'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="signup">
        <Card>
          <CardHeader>
            <CardTitle>Crie sua conta</CardTitle>
            <CardDescription>
              Preencha os campos para registrar-se.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...signUpForm}>
              <form
                onSubmit={signUpForm.handleSubmit(onSignUp)}
                className="space-y-4"
              >
                <FormField
                  control={signUpForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Seu nome" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={signUpForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="seu@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={signUpForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Mínimo de 6 caracteres"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={signUpForm.control}
                  name="userType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Tipo de Perfil</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="driver" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Motorista
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="admin" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Administrador
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormDescription>O primeiro usuário será sempre Administrador.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Criando conta...' : 'Criar Conta'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
