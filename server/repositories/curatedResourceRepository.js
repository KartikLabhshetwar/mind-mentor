import CuratedResource from '../models/curatedResource.js';

class CuratedResourceRepository {
  async findUserResources(userId) {
    return CuratedResource.find({ userId }).sort({ createdAt: -1 });
  }

  async findResourceByTopic(userId, normalizedTopic) {
    return CuratedResource.findOne({
      userId,
      topic: { $regex: new RegExp(`^${normalizedTopic}$`, 'i') }
    });
  }

  async findById(resourceId) {
    return CuratedResource.findById(resourceId);
  }

  async deleteResource(resourceId) {
    return CuratedResource.findByIdAndDelete(resourceId);
  }

  async saveResource(resourceData) {
    const resource = new CuratedResource(resourceData);
    return resource.save();
  }
}

export default new CuratedResourceRepository();
