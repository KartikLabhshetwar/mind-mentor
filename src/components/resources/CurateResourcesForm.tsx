import React, { useState } from 'react';
import { apiClient } from '@/lib/api-client';

interface Resource {
  title: string;
  link: string;
  type: string;
  description: string;
  benefits: string[];
}

interface CurateResourcesFormProps {
  userId: string;
  onResourcesGenerated: (resources: Resource[]) => void;
}

const CurateResourcesForm: React.FC<CurateResourcesFormProps> = ({ userId, onResourcesGenerated }) => {
  const [subject, setSubject] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await apiClient.createCuratedResources(userId, subject);
      
      if (response.error === 'RESOURCE_EXISTS') {
        setError('Resources for this subject already exist. Please check the existing resources.');
        return;
      }
      
      // Handle successful response
      setSuccess(true);
      onResourcesGenerated(response.resources);
      setSubject('');
    } catch (error: unknown) {
      console.error('Error creating resources:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to create resources. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
          Subject
        </label>
        <input
          type="text"
          id="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          placeholder="Enter a subject"
          required
        />
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                Resources created successfully!
              </h3>
            </div>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !subject.trim()}
        className={`inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
          loading || !subject.trim() ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {loading ? 'Creating...' : 'Create Resources'}
      </button>
    </form>
  );
};

export default CurateResourcesForm;