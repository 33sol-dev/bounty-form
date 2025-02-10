"use client";
import { useSearchParams } from "next/navigation";
import React, { Suspense, useState } from "react";

interface FormData {
  merchantName: string;
  upiId: string;
  merchantMobile: string;
  merchantEmail: string;
  company: string;
  address: string;
  campaignId: string;
}

interface ApiResponse {
  message: string;
  merchant?: {
    id: string;
  };
}

// Separate component that uses useSearchParams
function MerchantFormContent() {
  const searchParams = useSearchParams();
  const campaignId = searchParams.get('campaignId');

  const initialFormState: FormData = {
    merchantName: "",
    upiId: "",
    merchantMobile: "",
    merchantEmail: "",
    company: "",
    address: "",
    campaignId: campaignId || "",
  };

  const [formData, setFormData] = useState<FormData>(initialFormState);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  React.useEffect(() => {
    if (!campaignId) {
      setError("Campaign ID is required");
    }
  }, [campaignId]);

  // Rest of the component logic remains the same
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value.trim(),
    }));
    setError("");
  };

  const validateMobile = (mobile: string): boolean => {
    return /^\d{10}$/.test(mobile);
  };

  const validateUPI = (upi: string): boolean => {
    return /^[\w\.\-]+@[\w\.\-]+$/.test(upi);
  };

  const validateForm = (): boolean => {
    if (!formData.merchantName.trim()) {
      setError("Merchant name is required");
      return false;
    }
    if (!formData.upiId.trim()) {
      setError("UPI ID is required");
      return false;
    }
    if (!validateUPI(formData.upiId)) {
      setError("Please enter a valid UPI ID");
      return false;
    }
    if (!formData.merchantMobile.trim()) {
      setError("Mobile number is required");
      return false;
    }
    if (!validateMobile(formData.merchantMobile)) {
      setError("Please enter a valid 10-digit mobile number");
      return false;
    }
    if (!formData.company.trim()) {
      setError("Company name is required");
      return false;
    }
    if (!formData.campaignId) {
      setError("Campaign ID is missing");
      return false;
    }
    if (formData.merchantEmail && !formData.merchantEmail.includes('@')) {
      setError("Please enter a valid email address");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateForm()) return;

    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_BOUNTY_URL;
      if (!apiUrl) {
        throw new Error("API URL is not configured");
      }

      const response = await fetch(
        `${apiUrl}/api/merchant/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data: ApiResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create merchant");
      }

      setSuccess("Merchant created successfully!");
      setFormData(initialFormState);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error in creating merchant");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 bg-white">
      <div className="max-w-6xl mx-auto rounded-lg shadow-sm">
        <div className="p-8">
          <h2 className="text-3xl font-bold text-black mb-8">
            Add New Merchant
          </h2>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-md">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="merchantName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Merchant Name *
                </label>
                <input
                  type="text"
                  id="merchantName"
                  name="merchantName"
                  value={formData.merchantName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter merchant name"
                />
              </div>

              <div>
                <label
                  htmlFor="upiId"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  UPI ID *
                </label>
                <input
                  type="text"
                  id="upiId"
                  name="upiId"
                  value={formData.upiId}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter UPI ID (e.g., name@bank)"
                />
              </div>
            </div>

            {/* Rest of the form fields remain the same */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="merchantMobile"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  id="merchantMobile"
                  name="merchantMobile"
                  value={formData.merchantMobile}
                  onChange={handleChange}
                  required
                  pattern="[0-9]{10}"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter 10-digit mobile number"
                />
              </div>

              <div>
                <label
                  htmlFor="merchantEmail"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="merchantEmail"
                  name="merchantEmail"
                  value={formData.merchantEmail}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter email address"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="company"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Company Name *
              </label>
              <input
                type="text"
                id="company"
                name="company"
                value={formData.company}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter company name"
              />
            </div>

            <div>
              <label
                htmlFor="address"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Address
              </label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter address"
              />
            </div>

            <div className="pt-6">
              <button
                type="submit"
                disabled={loading || !campaignId}
                className="w-full px-6 py-3 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors duration-200"
              >
                {loading ? "Adding Merchant..." : "Add Merchant"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function FormLoader() {
  return (
    <div className="min-h-screen p-4 bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading form...</p>
      </div>
    </div>
  );
}

export default function MerchantForm() {
  return (
    <Suspense fallback={<FormLoader />}>
      <MerchantFormContent />
    </Suspense>
  );
}