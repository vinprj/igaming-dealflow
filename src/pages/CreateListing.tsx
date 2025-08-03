import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

const listingSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  country: z.string().min(1, 'Country is required'),
  license_type: z.string().min(1, 'License type is required'),
  price: z.coerce.number().positive('Price must be positive'),
  revenue_monthly: z.coerce.number().optional(),
  revenue_annual: z.coerce.number().optional(),
  is_public: z.boolean().default(false),
});

type ListingFormData = z.infer<typeof listingSchema>;

export default function CreateListing() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ListingFormData>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      country: '',
      license_type: '',
      price: 0,
      revenue_monthly: undefined,
      revenue_annual: undefined,
      is_public: false,
    },
  });

  const createListingMutation = useMutation({
    mutationFn: async (data: ListingFormData) => {
      const { error } = await supabase
        .from('listings')
        .insert({
          title: data.title,
          description: data.description,
          category: data.category,
          country: data.country,
          license_type: data.license_type,
          price: data.price,
          revenue_monthly: data.revenue_monthly,
          revenue_annual: data.revenue_annual,
          is_public: data.is_public,
          seller_id: user?.id,
          status: 'draft' as const,
        });

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: 'Listing created',
        description: 'Your listing has been created successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['seller-listings'] });
      form.reset();
    },
    onError: (error) => {
      toast({
        title: 'Failed to create listing',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: ListingFormData) => {
    createListingMutation.mutate(data);
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Listing</h1>
          <p className="text-muted-foreground">
            List your iGaming asset for potential buyers
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Asset Details</CardTitle>
            <CardDescription>
              Provide detailed information about your iGaming asset
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Established Casino Platform" {...field} />
                      </FormControl>
                      <FormDescription>
                        A clear, descriptive title for your listing
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Provide a detailed description of your asset..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Include key features, history, and unique selling points
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="casino">Casino</SelectItem>
                            <SelectItem value="sportsbook">Sportsbook</SelectItem>
                            <SelectItem value="poker">Poker</SelectItem>
                            <SelectItem value="bingo">Bingo</SelectItem>
                            <SelectItem value="lottery">Lottery</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Malta">Malta</SelectItem>
                            <SelectItem value="Gibraltar">Gibraltar</SelectItem>
                            <SelectItem value="Curacao">Curacao</SelectItem>
                            <SelectItem value="UK">United Kingdom</SelectItem>
                            <SelectItem value="Estonia">Estonia</SelectItem>
                            <SelectItem value="Isle of Man">Isle of Man</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="license_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>License Type</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., MGA Class I" {...field} />
                      </FormControl>
                      <FormDescription>
                        Specify the gaming license type and authority
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Asking Price (USD)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="revenue_monthly"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly Revenue (USD)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Optional" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="revenue_annual"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Annual Revenue (USD)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Optional" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="is_public"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Public Listing</FormLabel>
                        <FormDescription>
                          Make this listing visible to all users without requiring access approval
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => form.reset()}
                  >
                    Reset
                  </Button>
                  <Button
                    type="submit"
                    disabled={createListingMutation.isPending}
                  >
                    {createListingMutation.isPending ? 'Creating...' : 'Create Listing'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
