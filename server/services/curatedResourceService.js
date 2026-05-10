import curatedResourceRepository from '../repositories/curatedResourceRepository.js';
import { searchTavily, curateResources as aiCurateResources } from './aiService.js';

class CuratedResourceService {
  async getUserResources(userId) {
    if (!userId) {
      const error = new Error('userId is required');
      error.code = 'INVALID_INPUT';
      throw error;
    }
    return curatedResourceRepository.findUserResources(userId);
  }

  async createResources(subject, userId) {
    if (!subject?.trim() || !userId) {
      const error = new Error('Subject and userId are required');
      error.code = 'INVALID_INPUT';
      throw error;
    }

    const normalizedSubject = subject.trim().toLowerCase().replace(/\s+/g, ' ');
    const existingResources = await curatedResourceRepository.findResourceByTopic(userId, normalizedSubject);

    if (existingResources) {
      const error = new Error(`You already have curated resources for "${subject}". Please check your existing resources.`);
      error.code = 'RESOURCE_EXISTS';
      throw error;
    }

    const searchData = await searchTavily(subject);
    
    if (!searchData || !searchData.results) {
      const error = new Error('Failed to search for resources. Please try again.');
      error.code = 'SEARCH_FAILED';
      error.status = 500;
      throw error;
    }

    const curatedData = await aiCurateResources(searchData, subject);
    
    if (!curatedData || !curatedData.resources) {
      const error = new Error('Failed to curate resources. Please try again.');
      error.code = 'CURATION_FAILED';
      error.status = 500;
      throw error;
    }

    const validatedResources = curatedData.resources.map(resource => ({
      title: resource.title || 'Untitled Resource',
      link: resource.url || '#',
      type: resource.format || 'website',
      description: resource.description || 'No description available',
      benefits: resource.benefits || ['Resource for learning ' + subject]
    }));

    const resourceData = {
      userId,
      topic: normalizedSubject,
      resources: validatedResources,
      lastUpdated: new Date()
    };

    return curatedResourceRepository.saveResource(resourceData);
  }

  async deleteResource(resourceId) {
    if (!resourceId) {
      const error = new Error('resourceId is required');
      error.code = 'INVALID_INPUT';
      throw error;
    }

    const deletedResource = await curatedResourceRepository.deleteResource(resourceId);
    
    if (!deletedResource) {
      const error = new Error('Resource not found');
      error.code = 'RESOURCE_NOT_FOUND';
      error.status = 404;
      throw error;
    }

    return deletedResource;
  }
}

export default new CuratedResourceService();
