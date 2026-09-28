import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import api from "../../../../api/axios";
import "./businessAdd.css";

interface ApiError {
  response?: { data?: { message?: string } };
  message?: string;
}

interface FlatCategory {
  id: number;
  label: string;
  status: string;
}

export const BusinessAdd = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    bio: "",
    password: "",
    category_id: "",
  });

  const [categories, setCategories] = useState<FlatCategory[]>([]);

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get("/admin/categories/flat");
        if (res.data.status) {
          setCategories(res.data.data.filter((c: FlatCategory) => c.status === "active"));
        }
      } catch (err) {
        console.error("Failed to load categories", err);
      }
    };
    fetchCategories();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleReset = () => {
    setFormData({ name: "", email: "", phone: "", bio: "", password: "", category_id: "" });
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await api.post("/admin/businesses", formData);

      if (res.data.status) {
        setFormData({ name: "", email: "", phone: "", bio: "", password: "", category_id: "" });
        setSuccess("✅ Business account created successfully!");
        setTimeout(() => setSuccess(""), 4000);
      } else {
        setError(res.data.message || "Failed to create business.");
      }
    } catch (err: unknown) {
      const e = err as ApiError;
      setError(
        e?.response?.data?.message || e?.message || "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="biz-add">
      {/* Header */}
      <div className="biz-add__header">
        <h1 className="biz-add__title">Add Business</h1>
        <p className="biz-add__subtitle">
          Create a new business workspace and generate their unique credentials.
        </p>
      </div>

      {/* Card */}
      <div className="biz-add__card">
        <form onSubmit={handleSubmit} noValidate>

          {/* Business Name */}
          <div className="biz-add__group">
            <label className="biz-add__label" htmlFor="biz-name">
              Business Name <span className="biz-add__required">*</span>
            </label>
            <input
              id="biz-name"
              type="text"
              name="name"
              className="biz-add__input"
              placeholder="e.g. Acme Corporation"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          {/* Email & Phone */}
          <div className="biz-add__row">
            <div className="biz-add__group" style={{ marginBottom: 0 }}>
              <label className="biz-add__label" htmlFor="biz-email">
                Email Address <span className="biz-add__required">*</span>
              </label>
              <input
                id="biz-email"
                type="email"
                name="email"
                className="biz-add__input"
                placeholder="contact@acme.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="biz-add__group" style={{ marginBottom: 0 }}>
              <label className="biz-add__label" htmlFor="biz-phone">
                Phone Number <span className="biz-add__required">*</span>
              </label>
              <input
                id="biz-phone"
                type="text"
                name="phone"
                className="biz-add__input"
                placeholder="+1 (555) 000-0000"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="biz-add__group">
            <label className="biz-add__label" htmlFor="biz-password">
              Account Password <span className="biz-add__required">*</span>
            </label>
            <div className="biz-add__password-wrapper">
              <input
                id="biz-password"
                type={showPassword ? "text" : "password"}
                name="password"
                className="biz-add__input"
                placeholder="Set a strong password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="biz-add__eye-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Category */}
          <div className="biz-add__group">
            <label className="biz-add__label" htmlFor="biz-category">
              Category <span className="biz-add__required">*</span>
            </label>
            <select
              id="biz-category"
              name="category_id"
              className="biz-add__input"
              value={formData.category_id}
              onChange={handleChange as any}
              required
            >
              <option value="">Select a Category/Subcategory</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Bio */}
          <div className="biz-add__group">
            <label className="biz-add__label" htmlFor="biz-bio">
              Business Bio <span style={{ color: "#9ca3af", fontWeight: 400 }}>(Optional)</span>
            </label>
            <textarea
              id="biz-bio"
              name="bio"
              className="biz-add__textarea"
              placeholder="Tell us a little bit about this business..."
              value={formData.bio}
              onChange={handleChange}
              rows={4}
            />
          </div>

          {/* Feedback */}
          {error && <p className="biz-add__error">{error}</p>}
          {success && <p className="biz-add__success">{success}</p>}

          {/* Actions */}
          <div className="biz-add__actions">
            <button
              id="biz-add-submit"
              type="submit"
              className="biz-add__btn biz-add__btn--primary"
              disabled={loading}
            >
              {loading ? "Saving..." : "Register Business"}
            </button>
            <button
              type="button"
              className="biz-add__btn biz-add__btn--reset"
              onClick={handleReset}
              disabled={loading}
            >
              Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
