'use client'

import { useState } from 'react'
import {z} from 'zod';
import { groupSchema } from '../schema/groupSchema';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios, { AxiosError } from 'axios';
import { ApiResponse } from '@/src/features/auth/types/apiResponse';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe, Info, Loader2, Lock, Users, Wallet } from 'lucide-react';

type FormData = z.infer<typeof groupSchema>

const CreateGroupComponent = () => {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const form = useForm<FormData>({
      resolver: zodResolver(groupSchema),
      defaultValues: {
        groupName: "",
        description: "",
        groupType: "private",
        maxGroupSize: 2,
        criteria: {
          minimumWalletBalance: undefined,
        },
      },
    })

    const onSubmit = async (data: FormData) => {
      setIsLoading(true);
      try {
        const response = await axios.post('/api/savings/group/create', data);
        toast.success(response.data.message || "Group created successfully");
        router.replace('/dashboard');
      } catch (error) {
        const axiosError = error as AxiosError<ApiResponse>;
        let errorMessage = axiosError.response?.data.message || 'Failed to create group. Please try again.';
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="border-b">
          <div className="flex items-center space-x-3">
            <Users className="h-6 w-6 text-primary" />
            <div>
              <CardTitle className="text-2xl font-bold">Create New Savings Group</CardTitle>
              <CardDescription>Set up your group with the details below</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

              {/* Group Name */}
              <FormField
                control={form.control}
                name="groupName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      Group Name
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g. Financial Freedom Circle" 
                        {...field} 
                        className="h-11"
                      />
                    </FormControl>
                    <FormDescription>
                      Choose a name that reflects your group's purpose
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <Info className="h-4 w-4 mr-2" />
                      Description
                    </FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe your group's goals, rules, and expectations..." 
                        {...field} 
                        rows={4}
                        className="resize-none"
                      />
                    </FormControl>
                    <FormDescription>
                      This helps potential members understand your group
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Group Type */}
                <FormField
                  control={form.control}
                  name="groupType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        {field.value === 'public' ? (
                          <Globe className="h-4 w-4 mr-2" />
                        ) : (
                          <Lock className="h-4 w-4 mr-2" />
                        )}
                        Group Type
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select group type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="public">
                            <div className="flex items-center">
                              <Globe className="h-4 w-4 mr-2" />
                              Public - Anyone can join
                            </div>
                          </SelectItem>
                          <SelectItem value="private">
                            <div className="flex items-center">
                              <Lock className="h-4 w-4 mr-2" />
                              Private - Approved only
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {field.value === 'public' 
                          ? 'Visible to all members' 
                          : 'Only visible to invited members'}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Max Group Size */}
                <FormField
                  control={form.control}
                  name="maxGroupSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        Max Members
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="2" 
                          max="50" 
                          {...field} 
                          className="h-11"
                        />
                      </FormControl>
                      <FormDescription>
                        Recommended: 5-20 members for best results
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Minimum Wallet Balance (Optional) */}
              <FormField
                control={form.control}
                name="criteria.minimumWalletBalance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <Wallet className="h-4 w-4 mr-2" />
                      Minimum Wallet Balance
                      <span className="ml-2 text-xs text-muted-foreground">(Optional)</span>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <Input
                          type="number"
                          placeholder="No minimum requirement"
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          className="h-11 pl-8"
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Set a minimum balance requirement for members
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <div className="pt-4">
                <Button 
                  type="submit" 
                  className="w-full h-11 cursor-pointer" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Group...
                    </>
                  ) : (
                    'Create Savings Group'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

export default CreateGroupComponent
