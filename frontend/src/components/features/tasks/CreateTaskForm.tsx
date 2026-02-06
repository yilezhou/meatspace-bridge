import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const taskSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.enum(['Recon', 'Drop-off', 'Retrieval']),
  budget: z.number().min(1, 'Budget must be at least 1'),
  currency: z.enum(['USD', 'ETH', 'CREDITS']),
  latitude: z.number(),
  longitude: z.number(),
  radius: z.number().min(10, 'Radius must be at least 10 meters'),
});

type TaskFormValues = z.infer<typeof taskSchema>;

export const CreateTaskForm: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      category: 'Recon',
      currency: 'CREDITS',
      latitude: 0,
      longitude: 0,
      radius: 100,
    },
  });

  const onSubmit = async (data: TaskFormValues) => {
    console.log('Form Data:', data);
    // Future integration with Supabase will go here
    await new Promise((resolve) => setTimeout(resolve, 1000));
    alert('Task created successfully (mock)');
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-slate-900">Create New Task</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Title</label>
          <input
            {...register('title')}
            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
            placeholder="High-value target recon"
          />
          {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Description</label>
          <textarea
            {...register('description')}
            rows={3}
            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
            placeholder="Detailed instructions for the agent..."
          />
          {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Category</label>
            <select
              {...register('category')}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
            >
              <option value="Recon">Recon</option>
              <option value="Drop-off">Drop-off</option>
              <option value="Retrieval">Retrieval</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Budget</label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                type="number"
                {...register('budget', { valueAsNumber: true })}
                className="block w-full flex-1 rounded-none rounded-l-md border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
              />
              <select
                {...register('currency')}
                className="inline-flex items-center rounded-r-md border border-l-0 border-slate-300 bg-slate-50 px-3 text-slate-500 sm:text-sm"
              >
                <option value="CREDITS">CR</option>
                <option value="ETH">ETH</option>
                <option value="USD">USD</option>
              </select>
            </div>
            {errors.budget && <p className="mt-1 text-sm text-red-600">{errors.budget.message}</p>}
          </div>
        </div>

        <div className="border-t border-slate-200 pt-4">
          <h3 className="text-sm font-medium text-slate-900 mb-2">Location Data</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-slate-500">Latitude</label>
              <input
                type="number"
                step="any"
                {...register('latitude', { valueAsNumber: true })}
                className="mt-1 block w-full rounded-md border-slate-300 sm:text-sm border p-2"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500">Longitude</label>
              <input
                type="number"
                step="any"
                {...register('longitude', { valueAsNumber: true })}
                className="mt-1 block w-full rounded-md border-slate-300 sm:text-sm border p-2"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500">Radius (m)</label>
              <input
                type="number"
                {...register('radius', { valueAsNumber: true })}
                className="mt-1 block w-full rounded-md border-slate-300 sm:text-sm border p-2"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isSubmitting ? 'Creating...' : 'Launch Bounty'}
        </button>
      </form>
    </div>
  );
};
