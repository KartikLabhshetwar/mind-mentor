const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const apiClient = {
  async getCuratedResources(userId: string) {
    const url = `${API_BASE_URL}/curate-resources/${userId}`;

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch resources");
    }
    return response.json();
  },

  async createCuratedResources(userId: string, subject: string) {
    const response = await fetch(`${API_BASE_URL}/curate-resources`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId, subject }),
    });

    const data = await response.json();

    if (!response.ok) {
      // If it's a RESOURCE_EXISTS error, return it directly
      if (data.error === "RESOURCE_EXISTS") {
        return data;
      }
      // For other errors, throw them
      throw {
        status: response.status,
        error: data.error,
        message: data.message,
        response: { data },
      };
    }

    return data;
  },

  async getStudyPlan(userId: string) {
    const response = await fetch(`${API_BASE_URL}/generate-plan/${userId}`, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch study plan");
    }
    return response.json();
  },

  async createStudyPlan(userId: string, subject: string, examDate: string) {
    const response = await fetch(`${API_BASE_URL}/generate-plan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId, subject, examDate }),
    });

    const data = await response.json();

    if (!response.ok) {
      // If it's a PLAN_EXISTS error, return it directly
      if (data.error === "PLAN_EXISTS") {
        return data;
      }
      // For other errors, throw them
      throw {
        status: response.status,
        error: data.error,
        message: data.message,
        response: { data },
      };
    }

    return data;
  },

  async updateStudyPlanTask(
    planId: string,
    weekIndex: number,
    dayIndex: number,
    taskIndex: number,
    completed: boolean,
  ) {
    const response = await fetch(
      `${API_BASE_URL}/generate-plan/${planId}/task`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ weekIndex, dayIndex, taskIndex, completed }),
      },
    );

    const data = await response.json();
    if (!response.ok) {
      throw {
        status: response.status,
        error: data.error,
        message: data.message || "Failed to update task status",
        response: { data },
      };
    }
    return data;
  },

  async deleteStudyPlan(planId: string) {
    const response = await fetch(`${API_BASE_URL}/generate-plan/${planId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw {
        status: response.status,
        error: data.error,
        message: data.message || "Failed to delete plan",
        response: { data },
      };
    }

    return data;
  },

  async webSearch(query: string) {
    const response = await fetch(`${API_BASE_URL}/web-search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });
    if (!response.ok) {
      throw { status: response.status, ...(await response.json()) };
    }
    return response.json();
  },

  async deleteCuratedResources(resourceId: string) {
    const response = await fetch(
      `${API_BASE_URL}/curate-resources/${resourceId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    if (!response.ok) {
      throw new Error("Failed to delete resources");
    }
    return response.json();
  },
};
