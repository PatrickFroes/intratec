'use client'

import { useAppStore } from '@/lib/store'
import { useEffect, useState } from 'react'
import { History, Search } from 'lucide-react'

export default function AuditoriaPage() {
    const { logs, fetchLogs, currentUser } = useAppStore()
    const [searchTerm, setSearchTerm] = useState('')
    const [entityFilter, setEntityFilter] = useState('all')

    useEffect(() => {
        fetchLogs()
    }, [fetchLogs])

    const permissions = currentUser?.permissions || {}
    // @ts-ignore
    const canView = (permissions.auditoria && permissions.auditoria !== 'none') || currentUser?.role === 'admin'

    if (!canView) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">Você não tem permissão para ver os logs de auditoria.</p>
            </div>
        )
    }

    const filteredLogs = logs.filter(log => {
        const matchesSearch = 
            log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.details.toLowerCase().includes(searchTerm.toLowerCase())
        
        const matchesFilter = entityFilter === 'all' || log.entity === entityFilter

        return matchesSearch && matchesFilter
    })

    return (
        <div className="page-container space-y-6">
            <div>
                <h1 className="heading-1 flex items-center gap-2">
                    <History /> Auditoria de Ações
                </h1>
                <p className="text-slate-500 mt-2">
                    Histórico completo de alterações no sistema.
                </p>
            </div>

            <div className="flex gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                    <input 
                        type="text" 
                        placeholder="Buscar por usuário, ação ou detalhe..." 
                        className="input-field pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select 
                    className="input-field max-w-xs"
                    value={entityFilter}
                    onChange={(e) => setEntityFilter(e.target.value)}
                >
                    <option value="all">Todas as Entidades</option>
                    <option value="store">Lojas</option>
                    <option value="user">Usuários</option>
                    <option value="task">Tarefas</option>
                    <option value="property">Propriedades</option>
                    <option value="client">Clientes</option>
                </select>
            </div>

            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data/Hora</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuário</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ação</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entidade</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detalhes</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(log.timestamp).toLocaleString('pt-BR')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{log.userName}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                        ${log.action.includes('delete') || log.action.includes('remove') ? 'bg-red-100 text-red-800' : 
                                          log.action.includes('create') || log.action.includes('add') ? 'bg-green-100 text-green-800' : 
                                          'bg-blue-100 text-blue-800'}`}>
                                        {log.action}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {log.entity}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 max-w-md truncate" title={log.details}>
                                    {log.details}
                                </td>
                            </tr>
                        ))}
                        {filteredLogs.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                                    Nenhum registro encontrado.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
