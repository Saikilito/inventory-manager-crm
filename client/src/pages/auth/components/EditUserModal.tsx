import React, { useEffect, useState } from "react";
import { useAuthPloc } from "@contexts/auth-context";
import { IUser } from "@shared-domain/user/user.entity";
import { NonEmptyStringVO } from "@shared-domain/shared/value-objects/non-empty-string.vo";
import { UsernameVO } from "@shared-domain/shared/value-objects/username.vo";
import { EmailVO } from "@shared-domain/shared/value-objects/email.vo";
import { z } from "zod";
import { X, Edit2 } from "lucide-react";
import Alert from "../../../components/Alert";

const editUserSchema = z.object({
  name: z.string().trim().min(1, { message: "Full Name is required" }),
  username: z
    .string()
    .trim()
    .min(1, { message: "Username is required" })
    .refine((val) => !/\s/.test(val), {
      message: "Username cannot contain spaces",
    }),
  email: z
    .string()
    .trim()
    .min(1, { message: "Email is required" })
    .email({ message: "Invalid email address" }),
});

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: IUser;
  onSuccess: () => void;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  onClose,
  user,
  onSuccess,
}) => {
  const ploc = useAuthPloc();

  // Form states
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (user) {
      setName(String(user.name));
      setUsername(String(user.user));
      setEmail(String(user.email));
      setError(null);
    }
  }, [user]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate using Zod
    const validation = editUserSchema.safeParse({
      name,
      username,
      email,
    });

    if (!validation.success) {
      const firstError =
        validation.error.issues[0]?.message || "Validation error";
      setError(firstError);
      return;
    }

    setIsEditing(true);
    try {
      await ploc.updateUser(String(user.id), {
        name: NonEmptyStringVO.create(name),
        user: UsernameVO.create(username),
        email: EmailVO.create(email),
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to update user");
    } finally {
      setIsEditing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl p-6 relative animate-slide-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 flex items-center justify-center">
            <Edit2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-stone-900 dark:text-stone-50">
              Edit User Details
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Modify profile credentials.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <Alert type="error" message={error} />}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
              Full Name
            </label>
            <input
              type="text"
              required
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-11 px-3 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-stone-950 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
              Username
            </label>
            <input
              type="text"
              required
              placeholder="johndoe"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full h-11 px-3 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-stone-950 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-11 px-3 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-stone-950 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
            />
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 border border-stone-200 dark:border-stone-800 rounded-lg text-stone-700 dark:text-stone-300 text-sm font-medium hover:bg-stone-50 dark:hover:bg-stone-950/40 transition-colors focus:outline-none cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isEditing}
              className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg shadow-sm hover:shadow transition-all focus:outline-none flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isEditing ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;
