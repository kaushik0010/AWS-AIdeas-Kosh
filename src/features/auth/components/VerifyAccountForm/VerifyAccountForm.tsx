'use client'

import axios, { AxiosError } from 'axios';
import { useParams, useRouter } from 'next/navigation';
import * as z from 'zod';
import { toast } from 'sonner';
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { verifyTokenSchema } from '../../schema/verifyTokenSchema';
import { ApiResponse } from '../../types/apiResponse';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

type VerifyEmailValues = z.infer<typeof verifyTokenSchema>

const VerifyAccountForm = () => {
    const router = useRouter();
    const params = useParams<{email: string}>();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<VerifyEmailValues> ({
      resolver: zodResolver(verifyTokenSchema),
      defaultValues: {
        token: ''
      }
    })

    const onSubmit = async (data: VerifyEmailValues) => {
      setIsLoading(true);
      try {
          const response = await axios.post('/api/verify-code', {
            email: params.email,
            code: data.token
          })

          toast.success(response?.data.message || 'Account verified successfully!');

          router.replace('/login');

      } catch (error) {
          console.error("Error verifying account", error);
          const axiosError = error as AxiosError<ApiResponse>
          let errorMessage = axiosError.response?.data.message || 'Verification failed. Please try again.';
          toast.error(errorMessage);
      } finally {
          setIsLoading(false);
      }
    }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className='w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg'>
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="32" 
              height="32" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className="text-white"
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Verify Your Account
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            We've sent a 6-digit code to your registered email
          </p>
        </div>

        {/* Verification Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="token"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 dark:text-gray-300">Verification Code</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter 6-digit code" 
                      {...field} 
                      className="h-12 px-4 py-3 text-center text-lg font-mono tracking-widest rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      maxLength={6}
                    />
                  </FormControl>
                  <FormMessage className="text-sm text-red-500" />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full cursor-pointer h-12 rounded-lg bg-primary hover:bg-primary/90 transition-colors duration-200"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Verifying...</span>
                </div>
              ) : (
                'Verify Account'
              )}
            </Button>
          </form>
        </Form>

        {/* Footer Links */}
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          <p>
            Didn't receive a code?{' '}
            <button 
              className="font-medium text-primary hover:text-primary/80 transition-colors"
              onClick={() => toast.info('Resend functionality would be implemented here')}
            >
              Resend code
            </button>
          </p>
          <p className="mt-2">
            Wrong email?{' '}
            <button 
              className="font-medium cursor-pointer text-primary hover:text-primary/80 transition-colors"
              onClick={() => router.back()}
            >
              Go back
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default VerifyAccountForm
