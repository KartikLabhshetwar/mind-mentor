import express from 'express';
import * as curateResourcesController from '../controllers/curateResourcesController.js';

const router = express.Router();

// Get resources for a user
router.get('/:userId', curateResourcesController.getResources);

// Create new resources
router.post('/', curateResourcesController.createResources);

// Delete a resource
router.delete('/:resourceId', curateResourcesController.deleteResource);

export default router;