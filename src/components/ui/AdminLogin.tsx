import React, { useState } from "react";
import { authAPI } from "@/lib/api";
import { saveUserSession } from "@/lib/storage";
import toast from "react-hot-toast";
import { Card } from "./Card";
import { Button } from "./Button";

interface AdminLoginData {
  phone: string;
  password: string;
}

export const AdminLoginForm = ({
  onAuthSuccess,
}: {
  onAuthSuccess: (user: Record<string, any>) => void;
}) => {
  const [formData, setFormData] = useState<AdminLoginData>({
    phone: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await authAPI.login(formData.phone, formData.password);

      if (data.success && data.user) {
        
        if (data.user.role !== "admin") {
          toast.error("Access denied. Admin privileges required.");
          return;
        }

        
        saveUserSession({
          userType: data.user.role as "client" | "cleaner" | "admin",
          name: data.user.name,
          phone: data.user.phone,
          lastSignedIn: new Date().toISOString(),
        });

        toast.success("Admin login successful!");
        onAuthSuccess(data.user);
      } else {
        toast.error(data.message || "Admin authentication failed");
      }
    } catch (error: any) {
      const errorMessage = error?.message || "Network error. Please try again.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-yellow-400/20">
            <span className="text-yellow-400 text-2xl">🔐</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-yellow-400">
            Admin Login
          </h2>
          <p className="mt-2 text-sm text-slate-300">
            Sign in to access the admin dashboard
          </p>
        </div>

        <Card className="bg-slate-900 border border-yellow-400/40 p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="admin-phone"
                className="block text-sm font-medium text-yellow-400 mb-2"
              >
                Admin Phone Number
              </label>
              <input
                id="admin-phone"
                name="phone"
                type="tel"
                pattern="0[17]\d{8}"
                placeholder="07XXXXXXXX or 01XXXXXXXX"
                required
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              />
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="block text-sm font-medium text-yellow-400 mb-2"
              >
                Admin Password
              </label>
              <input
                id="admin-password"
                name="password"
                type="password"
                required
                minLength={6}
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                placeholder="Enter your admin password"
              />
            </div>

            <div>
              <Button
                type="submit"
                disabled={loading}
                loading={loading}
                className="w-full bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold py-3 px-4 rounded-lg"
              >
                {loading ? "Authenticating..." : "Sign In as Admin"}
              </Button>
            </div>

            <div className="text-center">
              <a
                href="/admin/register"
                className="text-yellow-400 hover:text-yellow-300 text-sm"
              >
                Need an admin account? Register here
              </a>
            </div>
          </form>
        </Card>

        <div className="text-center">
          <a href="/" className="text-slate-400 hover:text-slate-300 text-sm">
            ← Back to Main Site
          </a>
        </div>
      </div>
    </div>
  );
};
