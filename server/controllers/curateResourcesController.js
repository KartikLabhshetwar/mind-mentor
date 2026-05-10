import curatedResourceService from '../services/curatedResourceService.js';

export const getResources = async (req, res) => { 
  try {
    const resources = await curatedResourceService.getUserResources(req.params.userId);
    res.json({ success: true, resources });
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(error.status || 400).json({ 
      success: false, 
      error: error.code || 'SERVER_ERROR',
      message: error.message || 'Failed to fetch resources' 
    });
  }
};

export const createResources = async (req, res) => {
  try {
    const { subject, userId } = req.body;
    const resources = await curatedResourceService.createResources(subject, userId);
    
    return res.json({
      success: true,
      message: 'Resources curated successfully',
      resources: resources
    });
  } catch (error) {
    console.error('Error in resource curation:', error);
    return res.status(error.status || 400).json({
      success: false,
      error: error.code || 'SERVER_ERROR',
      message: error.message || 'An error occurred while curating resources. Please try again.'
    });
  }
};

export const deleteResource = async (req, res) => {
  try {
    await curatedResourceService.deleteResource(req.params.resourceId);
    res.json({ success: true, message: 'Resource deleted successfully' });
  } catch (error) {
    console.error('Error deleting resource:', error);
    res.status(error.status || 400).json({
      success: false,
      error: error.code || 'SERVER_ERROR',
      message: error.message || 'Failed to delete resource'
    });
  }
};
