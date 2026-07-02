'use client'

import { useAppStore, DEFAULT_PERMISSIONS_USER, DEFAULT_PERMISSIONS_ADMIN, UserPermissions, PermissionLevel, User } from '@/lib/store'
import { Users, Plus, Trash2, Shield, Eye, EyeOff, Search, Lock, Edit } from 'lucide-react'
import { useState } from 'react'

export default function Corretores() {
  const { currentUser, users, addUser, removeUser, updateUser } = useAppStore()
  const [showForm, setShowForm] = useState(false)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    permissions: DEFAULT_PERMISSIONS_USER,
    password: '',
  })
  const [showPasswords, setShowPasswords] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Check permissions
  const canManageUsers = currentUser?.role === 'admin' || currentUser?.permissions?.corretores === 'editor'

  if (!canManageUsers) {
    return (
      <div className="p-8">
        <div className="card text-center py-12">
          <Shield size={48} className="mx-auto text-red-600 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Restrito</h2>
          <p className="text-gray-600">
            Você não tem permissão para gerenciar usuários.
          </p>
        </div>
      </div>
    )
  }

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.name || !formData.email) {
        alert('Nome e email são obrigatórios')
        return
    }
    
    if (!editingUserId && !formData.password) {
        alert('Senha é obrigatória para novos usuários')
        return
    }

    const isFullAdmin = Object.values(formData.permissions).every(p => p === 'editor')
    
    // Prepare Data
    const userData: Partial<User> = {
        name: formData.name,
        email: formData.email.toLowerCase(),
        role: (isFullAdmin ? 'admin' : 'user') as 'admin' | 'user',
        permissions: formData.permissions,
    }

    // Only update password if provided
    if (formData.password) {
        userData.password = formData.password
    }

    if (editingUserId) {
        // Update
        updateUser(editingUserId, userData)
    } else {
        // Create
        // @ts-ignore
        addUser({ ...userData, password: formData.password! })
    }

    // Reset Form
    setFormData({
      name: '',
      email: '',
      permissions: DEFAULT_PERMISSIONS_USER,
      password: '',
    })
    setEditingUserId(null)
    setShowForm(false)
  }

  const handleEditUser = (user: User) => {
      setEditingUserId(user.id)
      setFormData({
          name: user.name,
          email: user.email,
          permissions: user.permissions || DEFAULT_PERMISSIONS_USER,
          password: '' // Don't fill password for security, leave empty to keep current
      })
      setShowForm(true)
  }

  const handleDeleteUser = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
        removeUser(id)
    }
  }

  const usersList = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Corretores/Usuários</h1>
          <p className="text-gray-600 mt-2">
            Exibindo {usersList.length} de {users.length} usuários
          </p>
        </div>
        <button
          onClick={() => {
              setEditingUserId(null)
              setFormData({
                name: '',
                email: '',
                permissions: DEFAULT_PERMISSIONS_USER,
                password: '',
              })
              setShowForm(!showForm)
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} /> Novo Usuário
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Buscar por nome ou email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>

      {/* Form */}
      {showForm && (
        <div className="card mb-8">
          <h3 className="text-lg font-semibold mb-4">{editingUserId ? 'Editar Usuário' : 'Cadastrar Novo Usuário'}</h3>
          <form onSubmit={handleSaveUser} className="space-y-4">
            <input
              type="text"
              placeholder="Nome completo"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="input-field"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="input-field"
              required
            />
            <div>
                <input
                    type="password"
                    placeholder="Senha"
                    value={formData.password}
                    onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                    }
                    className="input-field w-full"
                    required={!editingUserId}
                />
                {editingUserId && (
                    <p className="text-xs text-gray-500 mt-1 ml-1">Deixe em branco para manter a senha atual.</p>
                )}
            </div>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                        <Shield size={18} className="text-blue-600"/> 
                        Permissões de Acesso
                    </h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.keys(DEFAULT_PERMISSIONS_USER).map((key) => {
                        const permKey = key as keyof UserPermissions;
                        // Safety check if user somehow has a permission object that lacks this key
                        const currentValue = formData.permissions[permKey] || 'none'
                        
                        return (
                            <div key={key} className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded">
                                <label className="text-sm font-medium text-gray-700 capitalize">
                                    {key.replace(/([A-Z])/g, ' $1')}
                                </label>
                                <select
                                    value={currentValue}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        permissions: {
                                            ...prev.permissions,
                                            [permKey]: e.target.value as PermissionLevel
                                        }
                                    }))}
                                    className="text-sm p-1 border rounded w-32"
                                >
                                    <option value="none">Bloqueado</option>
                                    <option value="reader">Leitor</option>
                                    <option value="editor">Editor</option>
                                </select>
                            </div>
                        )
                    })}
                </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary">
                {editingUserId ? 'Salvar Alterações' : 'Cadastrar Usuário'}
              </button>
              <button
                type="button"
                onClick={() => {
                    setShowForm(false)
                    setEditingUserId(null)
                }}
                className="btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users Table */}
      <div className="card overflow-x-auto">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-600">
            Senhas são armazenadas apenas para demonstração local. Integre com um backend seguro para produção.
          </p>
          <button
            onClick={() => setShowPasswords((p) => !p)}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
          >
            {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
            {showPasswords ? 'Ocultar senhas' : 'Mostrar senhas'}
          </button>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left px-6 py-3 font-semibold text-gray-900">
                Nome
              </th>
              <th className="text-left px-6 py-3 font-semibold text-gray-900">
                Email
              </th>
              <th className="text-left px-6 py-3 font-semibold text-gray-900">
                Função
              </th>
              <th className="text-left px-6 py-3 font-semibold text-gray-900">
                Senha
              </th>
              <th className="text-center px-6 py-3 font-semibold text-gray-900">
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {usersList.map((user) => (
              <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-6 py-4">{user.name}</td>
                <td className="px-6 py-4 text-gray-600">{user.email}</td>
                <td className="px-6 py-4">
                  {(() => {
                      const permissions = user.permissions || (user.role === 'admin' ? DEFAULT_PERMISSIONS_ADMIN : DEFAULT_PERMISSIONS_USER);
                      const editorCount = Object.values(permissions).filter(p => p === 'editor').length;
                      const readerCount = Object.values(permissions).filter(p => p === 'reader').length;
                      const totalModules = Object.keys(permissions).length;
                      
                      const isFullAdmin = editorCount === totalModules;

                      return (
                          <div className="flex flex-col gap-1">
                              {isFullAdmin ? (
                                   <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold bg-purple-100 text-purple-700">
                                      <Shield size={12} /> Admin Total
                                   </span>
                              ) : (
                                  <div className="flex gap-1 flex-wrap">
                                      {editorCount > 0 && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded border border-green-200">Editor: {editorCount}</span>}
                                      {readerCount > 0 && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded border border-blue-200">Leitor: {readerCount}</span>}
                                      {editorCount === 0 && readerCount === 0 && <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Sem Acesso</span>}
                                  </div>
                              )}
                          </div>
                      )
                  })()}
                </td>
                <td className="px-6 py-4 text-gray-500">
                  <span className="inline-flex items-center gap-2">
                    <Lock size={14} className="text-gray-400" />
                    {showPasswords ? user.password : '••••••••'}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => handleEditUser(user)}
                        className="p-2 hover:bg-blue-100 hover:text-blue-600 rounded transition-colors text-gray-600"
                        title="Editar usuário"
                    >
                        <Edit size={18} />
                    </button>
                    <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-2 hover:bg-red-100 hover:text-red-600 rounded transition-colors text-gray-600"
                        title="Deletar usuário"
                    >
                        <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && !showForm && (
        <div className="text-center py-12">
          <Users size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">Nenhum usuário cadastrado</p>
        </div>
      )}
    </div>
  )
}
