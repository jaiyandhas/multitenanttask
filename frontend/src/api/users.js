export function usersApi(api) {
  return {
    async getUsers() {
      const res = await api.get('/api/users')
      return res.data.users
    },
    async createInviteLink(role) {
      const res = await api.post('/api/users/invite-link', { role })
      return res.data.inviteLink
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

