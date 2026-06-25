import React, { useEffect, useState } from "react";
import { usePlocState } from "@hooks/use-ploc-state";
import { useAuthPloc } from "@contexts/auth-context";
import { UserRole, Role } from "@shared-domain/shared/value-objects/role.vo";
import { IUser } from "@shared-domain/user/user.entity";

import {
  Mail,
  UserX,
  UserPlus,
  Edit2,
  Shield,
  UserCheck,
  User as UserIcon,
} from "lucide-react";
import Alert from "../../components/Alert";
import AddUserModal from "./components/AddUserModal";
import EditUserModal from "./components/EditUserModal";

export const UsersPage: React.FC = () => {
  const ploc = useAuthPloc();
  const state = usePlocState(ploc);

  // Modal control states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Selected user for editing
  const [editingUser, setEditingUser] = useState<IUser | null>(null);

  useEffect(() => {
    ploc.getUsers();
  }, [ploc]);

  const currentUser = state.kind === "auth:authenticated" ? state.user : null;
  const usersList =
    state.kind === "auth:authenticated" ? state.users || [] : [];
  const isLoading =
    state.kind === "auth:authenticated" ? state.usersLoading : false;

  if (state.kind !== "auth:authenticated" || !currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900 dark:border-stone-100"></div>
        <p className="text-sm text-stone-500 mt-2">Loading authorization...</p>
      </div>
    );
  }

  const handleToggleDisabled = async (targetUser: IUser) => {
    if (String(targetUser.id) === String(currentUser.id)) {
      // Prevent frontend self lockout
      return;
    }
    const newDisabledState = !targetUser.disabled;
    await ploc.updateUser(String(targetUser.id), {
      disabled: newDisabledState,
    });
  };

  const handleRoleChange = async (targetUser: IUser, newRole: string) => {
    if (String(targetUser.id) === String(currentUser.id)) {
      // Prevent frontend self demotion
      return;
    }
    await ploc.updateUser(String(targetUser.id), { role: newRole as Role });
  };

  const openEditModal = (user: IUser) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header section */}
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
            User Management
          </h1>
          <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
            A list of all users in your organization including their name, role,
            and status.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm hover:shadow transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 cursor-pointer"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add User
          </button>
        </div>
      </div>

      {state.errorMessage && (
        <div className="mb-6">
          <Alert type="error" message={state.errorMessage} />
        </div>
      )}

      {/* Users table */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900 dark:border-stone-100"></div>
          </div>
        ) : usersList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <UserX className="w-12 h-12 text-stone-400 mb-3" />
            <h3 className="text-lg font-medium text-stone-950 dark:text-stone-100">
              No users found
            </h3>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Get started by creating a new team member.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-200 dark:divide-stone-800">
              <thead className="bg-stone-50 dark:bg-stone-950/40">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400"
                  >
                    User / Username
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400"
                  >
                    Email
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400"
                  >
                    Role
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400"
                  >
                    Status
                  </th>
                  <th scope="col" className="relative px-6 py-4">
                    <span className="sr-only">Edit</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 dark:divide-stone-800 bg-white dark:bg-stone-900">
                {usersList.map((user) => {
                  const isSelf = String(user.id) === String(currentUser.id);

                  return (
                    <tr
                      key={String(user.id)}
                      className="hover:bg-stone-50/50 dark:hover:bg-stone-950/20 transition-colors"
                    >
                      {/* Name + Username double decker */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-600 dark:text-stone-300">
                            {user.role === UserRole.ADMIN ? (
                              <Shield className="w-5 h-5 text-amber-500" />
                            ) : (
                              <UserIcon className="w-5 h-5 text-stone-500" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-stone-900 dark:text-stone-100 text-sm">
                              {String(user.name)}{" "}
                              {isSelf && (
                                <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-stone-400 dark:text-stone-500 font-mono mt-0.5">
                              @{String(user.user)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-600 dark:text-stone-300">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-stone-400" />
                          <span>{String(user.email)}</span>
                        </div>
                      </td>

                      {/* Role drop-down / badge */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {isSelf ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 border border-amber-200/50 dark:border-amber-900/40 text-amber-800 dark:text-amber-300">
                            <Shield className="w-3 h-3" />
                            Administrator
                          </span>
                        ) : (
                          <div className="relative inline-block w-40">
                            <select
                              value={String(user.role)}
                              onChange={(e) =>
                                handleRoleChange(user, e.target.value)
                              }
                              className="w-full bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-sm text-stone-950 dark:text-stone-100 py-1.5 pl-2.5 pr-8 focus:outline-none focus:ring-1 focus:ring-emerald-500 appearance-none cursor-pointer"
                            >
                              <option value={UserRole.SELLER}>Seller</option>
                              <option value={UserRole.ADMIN}>
                                Administrator
                              </option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-stone-500">
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M19 9l-7 7-7-7"
                                />
                              </svg>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Active Status toggle */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isSelf ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/50 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300">
                            <UserCheck className="w-3 h-3" />
                            Active
                          </span>
                        ) : (
                          <button
                            onClick={() => handleToggleDisabled(user)}
                            className="focus:outline-none cursor-pointer"
                            aria-label={
                              user.disabled
                                ? "Enable account"
                                : "Disable account"
                            }
                          >
                            <div
                              className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${user.disabled ? "bg-stone-200 dark:bg-stone-800" : "bg-emerald-500"}`}
                            >
                              <span
                                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${user.disabled ? "translate-x-0" : "translate-x-5"}`}
                              />
                            </div>
                          </button>
                        )}
                      </td>

                      {/* Edit Button */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openEditModal(user)}
                          className="text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 p-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
                          title="Edit User"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          setIsAddModalOpen(false);
          ploc.getUsers();
        }}
      />

      {/* Edit User Modal */}
      {editingUser && (
        <EditUserModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingUser(null);
          }}
          user={editingUser}
          onSuccess={() => {
            setIsEditModalOpen(false);
            setEditingUser(null);
          }}
        />
      )}
    </div>
  );
};

export default UsersPage;