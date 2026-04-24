export function tasksApi(api) {
  return {
    async getTasks() {
      const res = await api.get('/api/tasks')
      return res.data.tasks
    },
    async getStats() {
      const res = await api.get('/api/tasks/stats')
      return res.data
    },
    async getAudit(taskId) {
      const res = await api.get(`/api/tasks/${taskId}/audit`)
      return res.data.entries
    },
    async createTask(input) {
      const res = await api.post('/api/tasks', input)
      return res.data.task
    },
    async updateTask(id, patch) {
      const res = await api.patch(`/api/tasks/${id}`, patch)
      return res.data.task
    },
    async updateStatus(id, status) {
      const res = await api.patch(`/api/tasks/${id}/status`, { status })
      return res.data.task
    },
    async deleteTask(id) {
      const res = await api.delete(`/api/tasks/${id}`)
      return res.data
    }
  }
}

