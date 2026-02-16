'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form';
import z from 'zod';
import { campaignSchema } from '../schema/campaignSchema';
import { zodResolver } from '@hookform/resolvers/zod';
import axios, { AxiosError } from 'axios';
import { toast } from 'sonner';
import { ApiResponse } from '@/src/features/auth/types/apiResponse';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, startOfDay } from 'date-fns';

type FormData = z.infer<typeof campaignSchema>

interface GroupId {
  groupId: string
}

const CreateCampaignFormComponent = ({groupId}: GroupId) => {
    const [isLoading, setIsLoading] = useState(false);
    const [datePickerOpen, setDatePickerOpen] = useState(false)

    const form = useForm<FormData>({
        resolver: zodResolver(campaignSchema),
        defaultValues: {
          campaignName: "",
          startDate: new Date(),
          durationInMonths: 1,
          savingsDay: 1,
          amountPerMonth: 100,
          penaltyAmount: 30,
        },
    });

    const onSubmit = async (data: FormData) => {
      try {
        setIsLoading(true);
        const payload = {
          ...data,
          startOfDay: format(data.startDate, 'yyyy-MM-dd'),
        };
        const response = await axios.post(`/api/savings/group/${groupId}/create-campaign`, payload);
        toast.success(response.data.message || "Campaign created successfully");
        setTimeout(() => {
          window.location.reload()
        }, 500)

      } catch (error) {
        const axiosError = error as AxiosError<ApiResponse>;
        let errorMessage = axiosError.response?.data.message || 'Failed to create campaign';
        toast.error(errorMessage, {
          action: {
            label: "Retry",
            onClick: () => onSubmit(data)
          }
        });
      } finally {
        setIsLoading(false);
      }
    }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 sm:p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Campaign</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Set up a savings campaign for your group
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Campaign Name */}
            <FormField
              control={form.control}
              name="campaignName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 dark:text-gray-300">Campaign Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. Summer Savings Challenge" 
                      className="bg-white dark:bg-gray-800"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {/* Start Date with Calendar Popover */}
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-gray-700 dark:text-gray-300">Start Date</FormLabel>
                  <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "pl-3 text-left font-normal bg-white dark:bg-gray-800",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          field.onChange(date)
                          setDatePickerOpen(false)
                        }}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {/* Duration & Savings Day - Side by Side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="durationInMonths"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 dark:text-gray-300">Duration (Months)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="12"
                        className="bg-white dark:bg-gray-800"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="savingsDay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 dark:text-gray-300">Savings Day</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="31"
                        className="bg-white dark:bg-gray-800"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            {/* Amount & Penalty - Side by Side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amountPerMonth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 dark:text-gray-300">Monthly Amount</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-6 text-gray-500">$</span>
                        <Input
                          type="number"
                          min="1"
                          step="1"
                          className="pl-8 bg-white dark:bg-gray-800"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="penaltyAmount"
                render={({ field, formState }) => {
                  const amountPerMonth = form.watch("amountPerMonth");
                  const maxPenalty = amountPerMonth * 0.4;
                  
                  return (
                    <FormItem>
                      <FormLabel className="text-gray-700 dark:text-gray-300 text-sm">
                        Penalty Amount (Max: ${maxPenalty.toFixed(2)})
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                          <Input
                            type="number"
                            min="0"
                            max={maxPenalty}
                            step="1"
                            className="pl-8 bg-white dark:bg-gray-800"
                            {...field}
                            onChange={(e) => {
                              const value = Number(e.target.value);
                              field.onChange(value > maxPenalty ? maxPenalty : value);
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs" />
                      <div className="text-xs text-gray-500 mt-1">
                        {field.value > 0 && (
                          <span>
                            {((field.value / amountPerMonth) * 100).toFixed(0)}% of monthly amount
                          </span>
                        )}
                      </div>
                    </FormItem>
                  );
                }}
              />
            </div>

            <div className="pt-4">
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 cursor-pointer"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Campaign...
                  </>
                ) : (
                  'Create Campaign'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}

export default CreateCampaignFormComponent
