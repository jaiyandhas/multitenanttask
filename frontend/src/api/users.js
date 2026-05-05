export function usersApi(api) {
  return {
    async getUsers() {
      const res = await api.get('/api/users')
      return res.data.users
    },
    async addUser({ name, email, password, role }) {
      const res = await api.post('/api/users/add', { name, email, password, role })
      return res.data.user
    },
    async updateRole(id, role) {
      const res = await api.patch(`/api/users/${id}/role`, { role })
      return res.data.user
    },
    async removeUser(id) {
      const res = await api.delete(`/api/users/${id}`)
      return res.data
    }
  }
}

