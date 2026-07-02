'use client'

import { useAppStore, DEFAULT_PERMISSIONS_USER, DEFAULT_PERMISSIONS_ADMIN } from '@/lib/store'
import { useState, useMemo, useEffect, useRef } from 'react'
import { Plus, Trash2, ArrowRight, Search, Pencil, Upload, X, User } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { uploadImageAction } from '@/app/actions/storage'

export default function Cadastros() {
  const searchParams = useSearchParams()
  const { 
    currentUser,
    properties, stores, clients, users,
    addProperty, addStore, addClient,
    updateProperty, updateStore, updateClient,
    removeProperty, removeStore, removeClient 
  } = useAppStore()
  
  const permissions = currentUser?.permissions || (currentUser?.role === 'admin' ? DEFAULT_PERMISSIONS_ADMIN : DEFAULT_PERMISSIONS_USER)
  const canEdit = permissions.cadastros === 'editor'
  
  const [activeTab, setActiveTab] = useState<'properties' | 'stores' | 'clients'>('properties')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showPropertyForm, setShowPropertyForm] = useState(false)
  const [showStoreForm, setShowStoreForm] = useState(false)
  const [showClientForm, setShowClientForm] = useState(false)

  const [propertyData, setPropertyData] = useState({
    name: '',
    address: '',
    city: '',
    manager: '',
    phone: '',
    capacity: '',
    totalArea: '',
    image: '',
  })

  // Novo estado de cliente
  const [clientData, setClientData] = useState({
    name: '',
    email: '',
    phone: '',
    document: ''
  })

  const [storeData, setStoreData] = useState({
    name: '',
    propertyId: '',
    clientId: '',
    agentId: '',
    category: '',
    manager: '',
    phone: '',
    area: '',
    contractStart: '',
    contractEnd: '',
    rentValue: '',
    image: '',
  })

  const [searchTerm, setSearchTerm] = useState('')
  const [isNewCategory, setIsNewCategory] = useState(false)

  const propertyFileInputRef = useRef<HTMLInputElement>(null)
  const storeFileInputRef = useRef<HTMLInputElement>(null)

  const handlePropertyImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Preview
    const reader = new FileReader()
    reader.onloadend = () => {
      // Just for UX, showing partial preview while uploading
      // setPropertyData(prev => ({ ...prev, image: reader.result as string }))
    }
    reader.readAsDataURL(file)

    // Upload S3
    const formData = new FormData()
    formData.append('file', file)
    
    // We could add a loading state here
    try {
        const res = await uploadImageAction(formData)
        if (res.success && res.url) {
            setPropertyData(prev => ({ ...prev, image: res.url! }))
        } else {
            alert('Erro ao enviar imagem: ' + res.error)
            // Revert or clear?
            setPropertyData(prev => ({ ...prev, image: '' }))
        }
    } catch (err) {
        alert('Erro de conexão no upload.')
    }
  }

  const handleStoreImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Upload S3
    const formData = new FormData()
    formData.append('file', file)
    
    try {
        const res = await uploadImageAction(formData)
        if (res.success && res.url) {
             setStoreData(prev => ({ ...prev, image: res.url! }))
        } else {
             alert('Erro ao enviar imagem: ' + res.error)
             setStoreData(prev => ({ ...prev, image: '' }))
        }
    } catch (err) {
         alert('Erro de conexão no upload.')
    }
  }

  const existingCategories = useMemo(() => {
    const cats = new Set(stores.map(s => s.category).filter(Boolean))
    const defaults = ['Alimentação', 'Vestuário', 'Serviços', 'Eletrônicos', 'Lazer', 'Calçados', 'Acessórios', 'Decoração', 'Farmácia']
    defaults.forEach(d => cats.add(d))
    return Array.from(cats).sort()
  }, [stores])

  const isAdmin = currentUser?.role === 'admin'

  // --- Permission Filtering Utilities ---
  const myStores = stores.filter(s => {
      if (isAdmin) return true
      return s.agentId === currentUser?.id
  })

  // Properties visible to all (Agents need to see Malls to sell)
  const myProperties = properties

  // Clients visible only if match current user agent
  const myClients = clients.filter(c => {
      if (isAdmin) return true
      return c.agentId === currentUser?.id
  })

  const filteredProperties = myProperties.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.city.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredClients = myClients.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.document.includes(searchTerm)
  )

  const filteredStores = myStores.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleEditProperty = (property: any) => {
    setPropertyData({
      name: property.name,
      address: property.address,
      city: property.city,
      manager: property.manager || '',
      phone: property.phone || '',
      capacity: property.capacity?.toString() || '',
      totalArea: property.totalArea?.toString() || '',
      image: property.image || '',
    })
    setEditingId(property.id)
    setShowPropertyForm(true)
  }

  const handleEditClient = (client: any) => {
    setClientData({
      name: client.name,
      email: client.email || '',
      phone: client.phone || '',
      document: client.document
    })
    setEditingId(client.id)
    setShowClientForm(true)
  }

  const handleEditStore = (store: any) => {
    setStoreData({
      name: store.name,
      propertyId: store.propertyId,
      clientId: store.clientId || '', // Optional now
      agentId: store.agentId || '',
      category: store.category,
      manager: store.manager || '',
      phone: store.phone || '',
      area: store.area?.toString() || '',
      contractStart: store.contractStart || '',
      contractEnd: store.contractEnd || '',
      rentValue: store.rentValue?.toString() || '',
      image: store.image || '',
    })
    setEditingId(store.id)
    setShowStoreForm(true)
  }

  useEffect(() => {
    const editId = searchParams.get('editId')
    const type = searchParams.get('type')

    if (editId && type && canEdit) {
      if (type === 'property' && properties.length > 0) {
        const property = properties.find(p => p.id === editId)
        if (property) {
          setActiveTab('properties')
          handleEditProperty(property)
        }
      } else if (type === 'client' && clients.length > 0) {
        const client = clients.find(c => c.id === editId)
        if (client) {
            setActiveTab('clients')
            handleEditClient(client)
        }
      } else if (type === 'store' && stores.length > 0) {
        const store = stores.find(s => s.id === editId)
        if (store) {
            setActiveTab('stores')
            handleEditStore(store)
        }
      }
    }
  }, [searchParams, properties, clients, stores, canEdit])

  // Handlers for Deletion
  const handleDeleteProperty = async (id: string, name: string) => {
      if (confirm(`Tem certeza que deseja excluir o empreendimento "${name}"? Todas as lojas associadas a ele também podem ser afetadas.`)) {
          try {
              await removeProperty(id)
          } catch (error) {
              console.error(error)
              alert('Erro ao excluir empreendimento.')
          }
      }
  }

  const handleDeleteClient = async (id: string, name: string) => {
      if (confirm(`Tem certeza que deseja excluir o cliente "${name}"?`)) {
          try {
              await removeClient(id)
          } catch (error) {
              console.error(error)
              alert('Erro ao excluir cliente.')
          }
      }
  }

  const handleDeleteStore = async (id: string, name: string) => {
      if (confirm(`Tem certeza que deseja excluir a loja "${name}"?`)) {
          try {
              await removeStore(id)
          } catch (error) {
              console.error(error)
              alert('Erro ao excluir loja.')
          }
      }
  }

  const handleAddProperty = async (e: React.FormEvent) => {
    e.preventDefault()
    if (propertyData.name && propertyData.address && propertyData.city) {
      try {
        const payload = {
          name: propertyData.name,
          address: propertyData.address,
          city: propertyData.city,
          manager: propertyData.manager,
          phone: propertyData.phone,
          capacity: parseInt(propertyData.capacity) || 0,
          totalArea: parseFloat(propertyData.totalArea) || 0,
          image: propertyData.image,
        }

        if (editingId) {
          await updateProperty(editingId, payload)
        } else {
          await addProperty(payload)
        }

        setPropertyData({
          name: '',
          address: '',
          city: '',
          manager: '',
          phone: '',
          capacity: '',
          totalArea: '',
          image: '',
        })
        setShowPropertyForm(false)
        setEditingId(null)
      } catch (error) {
        console.error("Failed to save property:", error)
        alert('Erro ao salvar empreendimento. Verifique o console.')
      }
    }
  }

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (clientData.name && clientData.document) {
      try {
        const payload = {
          name: clientData.name,
          email: clientData.email,
          phone: clientData.phone,
          document: clientData.document
        }

        if (editingId) {
          await updateClient(editingId, payload)
        } else {
          await addClient({
            ...payload,
            agentId: currentUser?.id
          })
        }

        setClientData({
          name: '',
          email: '',
          phone: '',
          document: ''
        })
        setShowClientForm(false)
        setEditingId(null)
      } catch (error) {
        console.error("Failed to save client:", error)
        alert('Erro ao salvar cliente. Verifique o console.')
      }
    }
  }

  const handleAddStore = async (e: React.FormEvent) => {
    e.preventDefault()
    // ClientId is now optional
    if (storeData.name && storeData.propertyId && storeData.category) {
      try {
        const payload = {
          name: storeData.name,
          propertyId: storeData.propertyId,
          clientId: storeData.clientId || undefined, // Allow empty client (vacant store)
          category: storeData.category,
          manager: storeData.manager,
          phone: storeData.phone,
          area: parseInt(storeData.area) || 0,
          contractStart: storeData.contractStart,
          contractEnd: storeData.contractEnd,
          rentValue: parseFloat(storeData.rentValue) || 0,
          status: 'active' as const,
          image: storeData.image,
          agentId: storeData.agentId || currentUser?.id // Validate agent
        }

        if (editingId) {
          await updateStore(editingId, payload)
        } else {
          await addStore(payload)
        }

        setStoreData({
          name: '',
          propertyId: '',
          clientId: '',
          agentId: '',
          category: '',
          manager: '',
          phone: '',
          area: '',
          contractStart: '',
          contractEnd: '',
          rentValue: '',
          image: '',
        })
        setShowStoreForm(false)
        setIsNewCategory(false)
        setEditingId(null)
      } catch (error) {
        console.error("Failed to save store:", error)
        alert('Erro ao salvar loja. Verifique o console.')
      }
    } else {
        alert('Preencha os campos obrigatórios: Nome, Empreendimento e Categoria.')
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Cadastros</h1>
        <p className="text-gray-600 mt-2">Adicione novos empreendimentos, lojas e clientes</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-300">
        <button
          onClick={() => setActiveTab('properties')}
          className={`px-4 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'properties'
              ? 'text-blue-600 border-blue-600'
              : 'text-gray-600 border-transparent hover:text-gray-900'
          }`}
        >
          Empreendimentos
        </button>
        <button
          onClick={() => setActiveTab('clients')}
          className={`px-4 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'clients'
              ? 'text-blue-600 border-blue-600'
              : 'text-gray-600 border-transparent hover:text-gray-900'
          }`}
        >
          Clientes
        </button>
        <button
          onClick={() => setActiveTab('stores')}
          className={`px-4 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'stores'
              ? 'text-blue-600 border-blue-600'
              : 'text-gray-600 border-transparent hover:text-gray-900'
          }`}
        >
          Lojas
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Buscar no cadastro atual..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>

      {/* Properties Section */}
      {activeTab === 'properties' && (
        <div>
          {canEdit && (
          <button
            onClick={() => {
              setEditingId(null)
              setPropertyData({
                name: '',
                address: '',
                city: '',
                manager: '',
                phone: '',
                capacity: '',
                totalArea: '',
                image: '',
              })
              setShowPropertyForm(!showPropertyForm)
            }}
            className="btn-primary flex items-center gap-2 mb-6"
          >
            <Plus size={20} /> Novo Empreendimento
          </button>
          )}

          {showPropertyForm && (
            <div className="card mb-6 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                 <h3 className="text-xl font-bold text-gray-800">{editingId ? 'Editar Empreendimento' : 'Novo Empreendimento'}</h3>
                 <button 
                    onClick={() => setShowPropertyForm(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                 >
                    <X size={20} />
                 </button>
              </div>
              
              <form onSubmit={handleAddProperty} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Empreendimento</label>
                        <input
                            type="text"
                            placeholder="Ex: Shopping Center Norte"
                            value={propertyData.name}
                            onChange={(e) =>
                                setPropertyData({ ...propertyData, name: e.target.value })
                            }
                            className="input-field w-full"
                            required
                        />
                    </div>
                    
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                            <input
                            type="text"
                            placeholder="Rua, Número, Bairro"
                            value={propertyData.address}
                            onChange={(e) =>
                                setPropertyData({ ...propertyData, address: e.target.value })
                            }
                            className="input-field w-full"
                            required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                            <input
                            type="text"
                            placeholder="Cidade - UF"
                            value={propertyData.city}
                            onChange={(e) =>
                                setPropertyData({ ...propertyData, city: e.target.value })
                            }
                            className="input-field w-full"
                            required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Gerente Responsável</label>
                        <input
                        type="text"
                        placeholder="Nome completo"
                        value={propertyData.manager}
                        onChange={(e) =>
                            setPropertyData({ ...propertyData, manager: e.target.value })
                        }
                        className="input-field w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Telefone de Contato</label>
                        <input
                        type="tel"
                        placeholder="(00) 00000-0000"
                        value={propertyData.phone}
                        onChange={(e) =>
                            setPropertyData({ ...propertyData, phone: e.target.value })
                        }
                        className="input-field w-full"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Capacidade (nº lojas)</label>
                        <input
                            type="number"
                            placeholder="0"
                            value={propertyData.capacity}
                            onChange={(e) =>
                            setPropertyData({ ...propertyData, capacity: e.target.value })
                            }
                            className="input-field w-full"
                            min="1"
                        />
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Área Total (m²)</label>
                        <input
                            type="number"
                            placeholder="0.00"
                            value={propertyData.totalArea}
                            onChange={(e) =>
                            setPropertyData({ ...propertyData, totalArea: e.target.value })
                            }
                            className="input-field w-full"
                            min="1"
                        />
                    </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-gray-100">
                  <label className="block text-sm font-medium text-gray-700">Imagem de Capa</label>
                  <div className="p-4 border-2 border-dashed border-gray-200 rounded-lg hover:border-blue-400 transition-colors bg-gray-50 flex flex-col items-center justify-center gap-3">
                    <input
                      type="file"
                      ref={propertyFileInputRef}
                      onChange={handlePropertyImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    
                    {propertyData.image ? (
                        <div className="relative group w-full h-48 rounded-lg overflow-hidden border border-gray-200">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                              src={propertyData.image} 
                              alt="Preview" 
                              className="w-full h-full object-contain bg-white" 
                            />
                            <button
                              type="button"
                              onClick={() => setPropertyData(prev => ({ ...prev, image: '' }))}
                              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-90 hover:opacity-100 shadow-sm transition-opacity"
                              title="Remover imagem"
                            >
                              <X size={16} />
                            </button>
                        </div>
                    ) : (
                        <div className="text-center py-4">
                            <div className="bg-blue-100 p-3 rounded-full inline-flex mb-3 text-blue-600">
                                <Upload size={24} />
                            </div>
                            <p className="text-sm text-gray-600 mb-2">Clique para carregar uma imagem</p>
                            <button
                              type="button"
                              onClick={() => propertyFileInputRef.current?.click()}
                              className="text-xs text-blue-600 font-semibold hover:underline"
                            >
                              Selecionar Arquivo
                            </button>
                        </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                        setShowPropertyForm(false)
                        setEditingId(null)
                        setPropertyData({
                            name: '',
                            address: '',
                            city: '',
                            manager: '',
                            phone: '',
                            capacity: '',
                            totalArea: '',
                            image: '',
                        })
                    }}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm transition-colors flex items-center gap-2">
                    {editingId ? 'Salvar Alterações' : 'Cadastrar Empreendimento'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProperties.map((property) => (
              <div key={property.id} className="card group">
                {property.image && (
                  <div className="w-full h-32 mb-3 bg-gray-100 rounded-lg overflow-hidden border border-gray-100">
                     {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={property.image} alt={property.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex justify-between items-start mb-3">
                  <Link href={`/empreendimentos?id=${property.id}`} className="hover:text-blue-600 transition-colors">
                     <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors flex items-center gap-2">
                        {property.name}
                        <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                     </h3>
                  </Link>
                  <div className="flex gap-1">
                    {canEdit && (
                    <>
                    <button 
                        onClick={() => handleEditProperty(property)}
                        className="p-1 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded transition-colors"
                        title="Editar empreendimento"
                    >
                        <Pencil size={18} />
                    </button>
                    <button 
                        onClick={() => handleDeleteProperty(property.id, property.name)}
                        className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded transition-colors"
                        title="Excluir empreendimento"
                    >
                        <Trash2 size={18} />
                    </button>
                    </>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Endereço:</span> {property.address}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Cidade:</span> {property.city}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Gerente:</span> {property.manager}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clients Section */}
      {activeTab === 'clients' && (
        <div>
          {canEdit && (
          <button
            onClick={() => {
              setEditingId(null)
              setClientData({
                name: '',
                email: '',
                phone: '',
                document: ''
              })
              setShowClientForm(!showClientForm)
            }}
            className="btn-primary flex items-center gap-2 mb-6"
          >
            <Plus size={20} /> Novo Cliente
          </button>
          )}

          {showClientForm && (
            <div className="card mb-6 animate-in fade-in slide-in-from-top-4 duration-300 shadow-sm border border-gray-100">
               <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                 <h3 className="text-xl font-bold text-gray-800">{editingId ? 'Editar Cliente' : 'Novo Cliente'}</h3>
                 <button 
                    onClick={() => setShowClientForm(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                 >
                    <X size={20} />
                 </button>
              </div>

              <form onSubmit={handleAddClient} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                         <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Cliente/Empresa</label>
                         <input
                            type="text"
                            placeholder="Nome Completo ou Razão Social"
                            value={clientData.name}
                            onChange={(e) =>
                                setClientData({ ...clientData, name: e.target.value })
                            }
                            className="input-field w-full"
                            required
                        />
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Documento (CPF/CNPJ)</label>
                         <input
                            type="text"
                            placeholder="000.000.000-00"
                            value={clientData.document}
                            onChange={(e) =>
                                setClientData({ ...clientData, document: e.target.value })
                            }
                            className="input-field w-full"
                            required
                        />
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Email Principal</label>
                         <input
                            type="email"
                            placeholder="exemplo@email.com"
                            value={clientData.email}
                            onChange={(e) =>
                                setClientData({ ...clientData, email: e.target.value })
                            }
                            className="input-field w-full"
                        />
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Telefone Principal</label>
                         <input
                            type="tel"
                            placeholder="(00) 00000-0000"
                            value={clientData.phone}
                            onChange={(e) =>
                                setClientData({ ...clientData, phone: e.target.value })
                            }
                            className="input-field w-full"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowClientForm(false)
                      setEditingId(null)
                      setClientData({
                        name: '',
                        email: '',
                        phone: '',
                        document: ''
                      })
                    }}
                   className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                   <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm transition-colors flex items-center gap-2">
                    {editingId ? 'Salvar Alterações' : 'Cadastrar Cliente'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredClients.map((client) => {
               const clientStores = stores.filter(s => s.clientId === client.id)
               return (
                  <div key={client.id} className="card group">
                    <div className="flex justify-between items-start mb-3">
                      <Link href={`/clientes?id=${client.id}`} className="hover:text-blue-600 transition-colors">
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors flex items-center gap-2">
                            {client.name}
                            <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </h3>
                      </Link>
                      <div className="flex gap-1">
                        {canEdit && (
                        <>
                        <button 
                            onClick={() => handleEditClient(client)}
                            className="p-1 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded transition-colors"
                            title="Editar cliente"
                        >
                            <Pencil size={18} />
                        </button>
                        <button 
                            onClick={() => handleDeleteClient(client.id, client.name)}
                            className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded transition-colors"
                            title="Excluir cliente"
                        >
                            <Trash2 size={18} />
                        </button>
                        </>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                       <span className="font-medium">Documento:</span> {client.document}
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                       <span className="font-medium">Contato:</span> {client.email} | {client.phone}
                    </p>
                    
                    <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Lojas Associadas ({clientStores.length})</p>
                        {clientStores.length > 0 ? (
                            <ul className="text-sm text-slate-700 space-y-1">
                                {clientStores.map(store => (
                                    <li key={store.id} className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                                        {store.name}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-400 italic">Nenhuma loja associada</p>
                        )}
                    </div>
                  </div>
               )
            })}
          </div>
        </div>
      )}

      {/* Stores Section */}
      {activeTab === 'stores' && (
        <div>
          {canEdit && (
          <button
            onClick={() => {
              setEditingId(null)
              setStoreData({
                name: '',
                propertyId: '',
                clientId: '',
                agentId: '',
                category: '',
                manager: '',
                phone: '',
                area: '',
                contractStart: '',
                contractEnd: '',
                rentValue: '',
                image: '',
              })
              setShowStoreForm(!showStoreForm)
            }}
            className="btn-primary flex items-center gap-2 mb-6"
          >
            <Plus size={20} /> Nova Loja
          </button>
          )}

          {showStoreForm && (
            <div className="card mb-6 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                 <h3 className="text-xl font-bold text-gray-800">{editingId ? 'Editar Loja' : 'Nova Loja'}</h3>
                 <button 
                    onClick={() => setShowStoreForm(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                 >
                    <X size={20} />
                 </button>
              </div>

              <form onSubmit={handleAddStore} className="space-y-6">
                
                {/* Associação */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 p-4 rounded-lg">
                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Empreendimento (Local)</label>
                         <select
                            value={storeData.propertyId}
                            onChange={(e) =>
                                setStoreData({ ...storeData, propertyId: e.target.value })
                            }
                            className="input-field w-full"
                            required
                            >
                            <option value="">Selecione um empreendimento</option>
                            {properties.map((p) => (
                                <option key={p.id} value={p.id}>
                                {p.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Corretor Responsável</label>
                        <select
                            value={storeData.agentId}
                            onChange={(e) =>
                                setStoreData({ ...storeData, agentId: e.target.value })
                            }
                            className="input-field w-full"
                            >
                            <option value="">Selecione um corretor</option>
                            {users && users.length > 0 ? (
                                users.map(u => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                ))
                            ) : (
                                <option value={currentUser?.id}>{currentUser?.name} (Eu)</option>
                            )}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Se vazio, será atribuído a você.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cliente (Opcional)</label>
                        <select
                            value={storeData.clientId}
                            onChange={(e) =>
                                setStoreData({ ...storeData, clientId: e.target.value })
                            }
                            className="input-field w-full"
                            >
                            <option value="">Loja Vaga (Sem Cliente)</option>
                            {myClients.map((c) => (
                                <option key={c.id} value={c.id}>
                                {c.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Info Básica */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Loja</label>
                        <input
                            type="text"
                            placeholder="Nome Fantasia"
                            value={storeData.name}
                            onChange={(e) =>
                                setStoreData({ ...storeData, name: e.target.value })
                            }
                            className="input-field w-full"
                            required
                        />
                    </div>

                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                        {!isNewCategory ? (
                            <select
                                value={storeData.category}
                                onChange={(e) => {
                                    if (e.target.value === 'NEW_CATEGORY') {
                                        setIsNewCategory(true)
                                        setStoreData({ ...storeData, category: '' })
                                    } else {
                                        setStoreData({ ...storeData, category: e.target.value })
                                    }
                                }}
                                className="input-field w-full"
                                required
                            >
                                <option value="">Selecione uma Categoria</option>
                                {existingCategories.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                                <option value="NEW_CATEGORY" className="font-bold text-blue-600">+ Nova Categoria...</option>
                            </select>
                        ) : (
                            <div className="flex gap-2 animate-in fade-in zoom-in-95 duration-200">
                                <input
                                    type="text"
                                    placeholder="Digite a nova categoria"
                                    value={storeData.category}
                                    onChange={(e) =>
                                        setStoreData({ ...storeData, category: e.target.value })
                                    }
                                    className="input-field flex-1"
                                    autoFocus
                                    required
                                />
                                <button 
                                    type="button" 
                                    onClick={() => setIsNewCategory(false)}
                                    className="px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded border border-gray-200 transition-colors"
                                    title="Cancelar criação de categoria"
                                >
                                    Cancelar
                                </button>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Gerente da Loja</label>
                         <input
                            type="text"
                            placeholder="Nome do gerente"
                            value={storeData.manager}
                            onChange={(e) =>
                                setStoreData({ ...storeData, manager: e.target.value })
                            }
                            className="input-field w-full"
                        />
                    </div>
                </div>

                {/* Detalhes Financeiros e Contrato */}
                <div className="pt-4 border-t border-gray-100">
                    <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">Detalhes do Contrato</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-1">
                             <label className="block text-sm font-medium text-gray-700 mb-1">Área (m²)</label>
                             <input
                                type="number"
                                placeholder="0"
                                value={storeData.area}
                                onChange={(e) =>
                                setStoreData({ ...storeData, area: e.target.value })
                                }
                                className="input-field w-full"
                            />
                        </div>
                        <div className="md:col-span-1">
                             <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                             <input
                                type="tel"
                                placeholder="(00) 0000-0000"
                                value={storeData.phone}
                                onChange={(e) =>
                                    setStoreData({ ...storeData, phone: e.target.value })
                                }
                                className="input-field w-full"
                             />
                        </div>
                         <div className="md:col-span-2">
                             <label className="block text-sm font-medium text-gray-700 mb-1">Valor do Aluguel (Mensal)</label>
                             <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">R$</span>
                                <input
                                    type="number"
                                    placeholder="0,00"
                                    value={storeData.rentValue}
                                    onChange={(e) =>
                                    setStoreData({ ...storeData, rentValue: e.target.value })
                                    }
                                    className="input-field w-full pl-8"
                                />
                             </div>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Início do Contrato</label>
                            <input
                                type="date"
                                value={storeData.contractStart}
                                onChange={(e) =>
                                setStoreData({ ...storeData, contractStart: e.target.value })
                                }
                                className="input-field w-full"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Fim do Contrato</label>
                            <input
                                type="date"
                                value={storeData.contractEnd}
                                onChange={(e) =>
                                setStoreData({ ...storeData, contractEnd: e.target.value })
                                }
                                className="input-field w-full"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-gray-100">
                  <label className="block text-sm font-medium text-gray-700">Imagem da Loja (Fachada/Interior)</label>
                  <div className="p-4 border-2 border-dashed border-gray-200 rounded-lg hover:border-blue-400 transition-colors bg-gray-50 flex flex-col items-center justify-center gap-3">
                    <input
                      type="file"
                      ref={storeFileInputRef}
                      onChange={handleStoreImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    
                    {storeData.image ? (
                        <div className="relative group w-full h-48 rounded-lg overflow-hidden border border-gray-200">
                             {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                              src={storeData.image} 
                              alt="Preview" 
                              className="w-full h-full object-contain bg-white" 
                            />
                            <button
                              type="button"
                              onClick={() => setStoreData(prev => ({ ...prev, image: '' }))}
                              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-90 hover:opacity-100 shadow-sm transition-opacity"
                              title="Remover imagem"
                            >
                              <X size={16} />
                            </button>
                        </div>
                    ) : (
                        <div className="text-center py-4">
                            <div className="bg-blue-100 p-3 rounded-full inline-flex mb-3 text-blue-600">
                                <Upload size={24} />
                            </div>
                            <p className="text-sm text-gray-600 mb-2">Clique para carregar uma imagem</p>
                            <button
                              type="button"
                              onClick={() => storeFileInputRef.current?.click()}
                              className="text-xs text-blue-600 font-semibold hover:underline"
                            >
                              Selecionar Arquivo
                            </button>
                        </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                  <button
                    type="button"
                     onClick={() => {
                        setShowStoreForm(false)
                        setEditingId(null)
                        setStoreData({
                            name: '',
                            propertyId: '',
                            clientId: '',
                            agentId: '',
                            category: '',
                            manager: '',
                            phone: '',
                            area: '',
                            contractStart: '',
                            contractEnd: '',
                            rentValue: '',
                            image: '',
                        })
                    }}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                   <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm transition-colors flex items-center gap-2">
                    {editingId ? 'Salvar Alterações' : 'Cadastrar Loja'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStores.map((store) => {
               const property = properties.find(p => p.id === store.propertyId)
               const agent = users?.find(u => u.id === store.agentId)
               return (
                  <div key={store.id} className="card group">
                    {store.image && (
                      <div className="w-full h-32 mb-3 bg-gray-100 rounded-lg overflow-hidden border border-gray-100">
                        <img src={store.image} alt={store.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex justify-between items-start mb-3">
                      <Link href={`/lojas?id=${store.id}`} className="hover:text-blue-600 transition-colors">
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors flex items-center gap-2 flex-wrap">
                           {store.name}
                           {!store.clientId && (
                                <span className="bg-yellow-100 text-yellow-800 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                                    Vaga
                                </span>
                           )}
                           <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </h3>
                      </Link>
                      <div className="flex gap-1">
                        {canEdit && (
                        <>
                        <button 
                            onClick={() => handleEditStore(store)}
                            className="p-1 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded transition-colors"
                            title="Editar loja"
                        >
                            <Pencil size={18} />
                        </button>
                        <button 
                            onClick={() => handleDeleteStore(store.id, store.name)}
                            className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded transition-colors"
                            title="Excluir loja"
                        >
                            <Trash2 size={18} />
                        </button>
                        </>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-1">
                       <span className="font-medium">Empreendimento:</span> {property?.name || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                       <span className="font-medium">Categoria:</span> {store.category}
                    </p>
                    <p className="text-sm text-gray-600">
                       <span className="font-medium">Gerente:</span> {store.manager || '-'}
                    </p>

                    {agent && (
                        <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-gray-100 flex items-center gap-1.5">
                             <User size={14} className="text-slate-400" />
                             Corretor: <span className="font-medium text-slate-700">{agent.name}</span>
                        </p>
                    )}
                  </div>
               )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
