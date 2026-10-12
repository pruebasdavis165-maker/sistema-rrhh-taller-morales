'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { 
  UserPlus, 
  Users, 
  Shield, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  Trash2, 
  Lock, 
  Mail, 
  User as UserIcon,
  AlertCircle,
  Ban
} from 'lucide-react';
import { UsuarioDto, CrearUsuarioRequest, ActualizarUsuarioRequest, RolUsuario } from '@/types';
import { usuariosApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Modal from '@/components/Modal';

export default function UsuariosPage() {
  const { user: currentUser } = useAuth();
  const [usuarios, setUsuarios] = useState<UsuarioDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('todos');

  // Modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UsuarioDto | null>(null);
  const [deletingUser, setDeletingUser] = useState<UsuarioDto | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    nombreUsuario: '',
    nombreCompleto: '',
    correo: '',
    password: '',
    rol: 'RRHH' as RolUsuario,
    activo: true,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cargarUsuarios = async () => {
    try {
      setIsLoading(true);
      const data = await usuariosApi.listar();
      setUsuarios(data);
    } catch (err: any) {
      console.error('Error al cargar usuarios:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const handleOpenCreate = () => {
    setFormData({
      nombreUsuario: '',
      nombreCompleto: '',
      correo: '',
      password: '',
      rol: 'RRHH',
      activo: true,
    });
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (u: UsuarioDto) => {
    setEditingUser(u);
    setFormData({
      nombreUsuario: u.nombreUsuario,
      nombreCompleto: u.nombreCompleto,
      correo: u.correo,
      password: '',
      rol: u.rol,
      activo: u.activo,
    });
    setFormError(null);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.nombreUsuario.trim() || !formData.nombreCompleto.trim() || !formData.correo.trim() || !formData.password.trim()) {
      setFormError('Todos los campos son obligatorios.');
      return;
    }

    try {
      setIsSubmitting(true);
      await usuariosApi.crear({
        nombreUsuario: formData.nombreUsuario.trim(),
        nombreCompleto: formData.nombreCompleto.trim(),
        correo: formData.correo.trim(),
        password: formData.password,
        rol: formData.rol,
      });
      setIsCreateModalOpen(false);
      await cargarUsuarios();
    } catch (err: any) {
      setFormError(err?.message || 'Error al crear el usuario.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setFormError(null);

    try {
      setIsSubmitting(true);
      await usuariosApi.actualizar(editingUser.id, {
        nombreCompleto: formData.nombreCompleto.trim(),
        correo: formData.correo.trim(),
        rol: formData.rol,
        activo: formData.activo,
        nuevoPassword: formData.password.trim() ? formData.password.trim() : undefined,
      });
      setEditingUser(null);
      await cargarUsuarios();
    } catch (err: any) {
      setFormError(err?.message || 'Error al actualizar el usuario.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    try {
      setIsSubmitting(true);
      await usuariosApi.eliminar(deletingUser.id);
      setDeletingUser(null);
      await cargarUsuarios();
    } catch (err: any) {
      alert(err?.message || 'Error al eliminar el usuario.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = usuarios.filter((u) => {
    const matchesSearch =
      u.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.nombreUsuario.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.correo.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'todos' || u.rol === roleFilter;

    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (rol: string) => {
    switch (rol) {
      case 'Administrador':
        return 'bg-purple-50 text-purple-700 border-purple-200/80';
      case 'RRHH':
        return 'bg-blue-50 text-blue-700 border-blue-200/80';
      case 'Supervisor':
        return 'bg-amber-50 text-amber-700 border-amber-200/80';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  if (currentUser?.rol === 'Supervisor') {
    return (
      <div className="flex-1 flex flex-col bg-slate-50 min-h-screen">
        <Header
          title="Acceso Restringido"
          subtitle="Módulo Reservado • Taller de Torno Morales López"
        />
        <main className="p-8 max-w-lg w-full mx-auto my-auto text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
            <Ban className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Configuración del Sistema</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Su cuenta posee el rol de <strong>Supervisor de Taller</strong>. La administración y asignación de usuarios y roles está reservada para Administradores y Recursos Humanos.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
            >
              Volver al Panel Principal
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title="Gestión de Usuarios y Roles"
        subtitle="Administración de cuentas con acceso al sistema, asignación de roles y control de credenciales"
      />

      <main className="flex-1 p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Barra superior de métricas y acción */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Usuarios Registrados</h2>
              <p className="text-xs text-slate-500">
                {usuarios.length} cuentas en la base de datos PostgreSQL
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-sm shadow-blue-600/20 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Nuevo Usuario</span>
          </button>
        </div>

        {/* Toolbar de filtros */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, usuario o correo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs text-slate-500 font-medium">Filtrar por Rol:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="todos">Todos los Roles</option>
              <option value="Administrador">Administrador</option>
              <option value="RRHH">RRHH</option>
              <option value="Supervisor">Supervisor</option>
            </select>
          </div>
        </div>

        {/* Tabla de Usuarios */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-slate-400 text-xs">Cargando usuarios...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              No se encontraron usuarios con los criterios de búsqueda seleccionados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3.5 px-6">Usuario</th>
                    <th className="py-3.5 px-6">Correo</th>
                    <th className="py-3.5 px-6">Rol de Acceso</th>
                    <th className="py-3.5 px-6">Estado</th>
                    <th className="py-3.5 px-6">Último Acceso</th>
                    <th className="py-3.5 px-6 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs">
                            {u.nombreCompleto.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{u.nombreCompleto}</p>
                            <p className="text-[11px] text-slate-500">@{u.nombreUsuario}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-600">{u.correo}</td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${getRoleBadge(
                            u.rol
                          )}`}
                        >
                          <Shield className="w-3 h-3" />
                          <span>{u.rol}</span>
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {u.activo ? (
                          <span className="inline-flex items-center gap-1.5 text-emerald-600 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Activo</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-rose-500 font-medium">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Inactivo</span>
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-slate-500">
                        {u.ultimoAcceso ? new Date(u.ultimoAcceso).toLocaleString('es-NI') : 'Sin accesos'}
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          title="Editar usuario"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {u.nombreUsuario !== 'admin' && (
                          <button
                            onClick={() => setDeletingUser(u)}
                            title="Eliminar usuario"
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal: Crear Usuario */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Alta de Nuevo Usuario"
        >
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre Completo</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="ej. Juan Carlos López"
                  value={formData.nombreCompleto}
                  onChange={(e) => setFormData({ ...formData, nombreCompleto: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre de Usuario</label>
              <input
                type="text"
                required
                placeholder="ej. jlopez.rrhh"
                value={formData.nombreUsuario}
                onChange={(e) => setFormData({ ...formData, nombreUsuario: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Correo Electrónico</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="ej. jlopez@tornomorales.com"
                  value={formData.correo}
                  onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contraseña Inicial</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="Mínimo 6 caracteres"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Rol en el Sistema</label>
              <select
                value={formData.rol}
                onChange={(e) => setFormData({ ...formData, rol: e.target.value as RolUsuario })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              >
                <option value="RRHH">Analista de RRHH</option>
                <option value="Administrador">Administrador del Sistema</option>
                <option value="Supervisor">Supervisor de Taller</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50"
              >
                {isSubmitting ? 'Guardando...' : 'Crear Usuario'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal: Editar Usuario */}
        <Modal
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          title={`Editar Usuario @${editingUser?.nombreUsuario}`}
        >
          <form onSubmit={handleEditSubmit} className="space-y-4">
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre Completo</label>
              <input
                type="text"
                required
                value={formData.nombreCompleto}
                onChange={(e) => setFormData({ ...formData, nombreCompleto: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Correo Electrónico</label>
              <input
                type="email"
                required
                value={formData.correo}
                onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nueva Contraseña <span className="font-normal text-slate-400">(Opcional)</span>
              </label>
              <input
                type="password"
                placeholder="Dejar en blanco para no cambiarla"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Rol en el Sistema</label>
              <select
                value={formData.rol}
                onChange={(e) => setFormData({ ...formData, rol: e.target.value as RolUsuario })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              >
                <option value="RRHH">Analista de RRHH</option>
                <option value="Administrador">Administrador del Sistema</option>
                <option value="Supervisor">Supervisor de Taller</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="activo"
                checked={formData.activo}
                onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="activo" className="text-xs font-semibold text-slate-700">
                Cuenta de Usuario Activa
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50"
              >
                {isSubmitting ? 'Guardando...' : 'Actualizar Usuario'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal: Confirmar Eliminación */}
        <Modal
          isOpen={!!deletingUser}
          onClose={() => setDeletingUser(null)}
          title="Confirmar Eliminación"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              ¿Está seguro de que desea eliminar la cuenta de{' '}
              <strong className="text-slate-900 font-bold">{deletingUser?.nombreCompleto}</strong> (@
              {deletingUser?.nombreUsuario})? Esta acción es irreversible.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50"
              >
                {isSubmitting ? 'Eliminando...' : 'Eliminar Usuario'}
              </button>
            </div>
          </div>
        </Modal>
      </main>
    </div>
  );
}
