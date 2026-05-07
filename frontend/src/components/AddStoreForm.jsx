import { useState } from "react";
import { useLanguage } from "../hooks/useLanguage";
import { translations } from "../translations";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL
  : import.meta.env.DEV
    ? "http://localhost:5000"
    : "";

export default function AddStoreForm({ onAdd, onClose }) {
  const { language } = useLanguage();
  const t = translations[language] || translations.en;

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    categories: "",
    imageUrl: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!formData.name || !formData.phone || !formData.address || !formData.categories) {
      setError(t.addPurohithValidationError || "Please fill all required fields");
      setLoading(false);
      return;
    }
    try {
      if (!navigator?.geolocation) {
        throw new Error("Geolocation is not supported in this browser.");
      }
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const normalizedPhone = String(formData.phone || "").trim();
      const normalizedImageUrl = String(formData.imageUrl || "").trim();
      const requestBody = {
        name: formData.name,
        phone: normalizedPhone,
        address: formData.address,
        categories: formData.categories,
        services: formData.categories,
        service_type: "store",
        type: "store",
        place_id: normalizedPhone || undefined,
        imageUrl: normalizedImageUrl || undefined,
        image_url: normalizedImageUrl || undefined,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        location: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        },
      };

      const postStore = async (body) => {
        const response = await fetch(`${API_BASE_URL}/api/stores`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });

        let data = null;
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          data = await response.json();
        } else {
          const text = await response.text();
          data = text ? { error: text } : null;
        }

        return { response, data };
      };

      const localItem = {
        name: formData.name,
        phone: normalizedPhone,
        address: formData.address,
        categories: formData.categories,
        services: formData.categories,
        service_type: "store",
        type: "store",
        imageUrl: normalizedImageUrl || undefined,
        image_url: normalizedImageUrl || undefined,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        location: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        },
        distance: 0,
      };

      let { response, data } = await postStore(requestBody);

      if (!response.ok && response.status === 409) {
        const errorMessage = String(data?.error || "");
        const looksLikePlaceIdConflict = /place[_\s-]?id|unique constraint/i.test(errorMessage);
        if (looksLikePlaceIdConflict) {
          const retryBody = {
            ...requestBody,
            place_id: normalizedPhone ? `${normalizedPhone}-${Date.now()}` : `store-${Date.now()}`,
          };
          ({ response, data } = await postStore(retryBody));
        }
      }

      if (!response.ok) {
        const message = data?.error || "Failed to add store";
        if (response.status === 409) {
          const pretty =
            "A store with this number already exists. Please use a unique number.";
          throw new Error(message || pretty);
        }
        throw new Error(message);
      }

      setSuccess("Pooja store added successfully!");
      setFormData({
        name: "",
        phone: "",
        address: "",
        categories: "",
        imageUrl: "",
      });
      if (onAdd) onAdd(data?.data ?? localItem);
    } catch (err) {
      setError(err.message || "Failed to add store");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative bg-white/20 rounded-2xl p-6 w-full max-w-md mx-4 backdrop-blur-md border border-white/10">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-black text-amber-100">Add Pooja Store</h2>
          <button
            onClick={onClose}
            className="text-amber-100 hover:text-amber-300 transition"
            aria-label="Close"
          >
            x
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-black text-amber-100/70 mb-1">
              {t.name || "Name"}
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-amber-50 outline-none transition focus:border-amber-300/50 focus:ring-2 focus:ring-amber-300/20"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-black text-amber-100/70 mb-1">
              {t.phone || "Phone Number"}
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-amber-50 outline-none transition focus:border-amber-300/50 focus:ring-2 focus:ring-amber-300/20"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-black text-amber-100/70 mb-1">
              {t.address || "Address"}
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-amber-50 outline-none transition focus:border-amber-300/50 focus:ring-2 focus:ring-amber-300/20"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-black text-amber-100/70 mb-1">
              {t.imageUrl || "Store Image URL (optional)"}
            </label>
            <input
              type="url"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              className="w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-amber-50 outline-none transition focus:border-amber-300/50 focus:ring-2 focus:ring-amber-300/20"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-sm font-black text-amber-100/70 mb-1">
              {t.pujaEssentials || "Puja Essentials"}
            </label>
            <input
              type="text"
              name="categories"
              value={formData.categories}
              onChange={handleChange}
              className="w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-amber-50 outline-none transition focus:border-amber-300/50 focus:ring-2 focus:ring-amber-300/20"
              placeholder="e.g., Pooja items, incense, diyas, flowers"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-amber-400/20 px-4 py-2 text-xs font-black text-amber-100 transition hover:bg-amber-400/30"
          >
            {loading ? t.adding || "Adding..." : (t.poojaStoresAddButton || "Add Pooja Store")}
          </button>
        </form>
      </div>
    </div>
  );
}
