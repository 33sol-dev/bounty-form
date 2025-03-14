"use client"

import { useSearchParams } from "next/navigation"
import type React from "react"
import { Suspense, useState, useEffect } from "react"
import qrcode from "qrcode"
import { DollarSign, Loader2, MapPin, Trophy } from "lucide-react"

interface FormData {
  merchantName: string
  upiId: string
  merchantMobile: string
  merchantEmail: string
  company: string
  address: string
  campaignId: string
  latitude: number | null
  longitude: number | null
}

interface ApiResponse {
  message: string
  merchant: {
    id: string
    merchantName: string
    merchantCode: string
    qrLink: string
  }
}

interface MerchantDetails {
  id: string
  merchantName: string
  merchantCode: {
    _id: string
    code: string
  }
  qrLink: string
}

const TypewriterText = ({ onComplete }: { onComplete: () => void }) => {
  const [displayText, setDisplayText] = useState('');
  const fullText = "Hunt Bounty";
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < fullText.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + fullText[currentIndex]);
        setCurrentIndex(currentIndex + 1);
      }, 150);

      return () => clearTimeout(timeout);
    } else {
      const hideTimeout = setTimeout(() => {
        onComplete();
      }, 1000);

      return () => clearTimeout(hideTimeout);
    }
  }, [currentIndex, onComplete]);

  return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#151823] bg-opacity-90 z-50">
        <div className="text-center p-8">
          <span className="font-mono text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            {displayText}
            {currentIndex < fullText.length && (
              <span className="animate-pulse">|</span>
            )}
          </span>
        </div>
      </div>
    );
};

function MerchantFormContent() {
  const searchParams = useSearchParams()
  const campaignId = searchParams.get("campaign")
  const companyId = searchParams.get("company")

  const initialFormState: FormData = {
    merchantName: "",
    upiId: "",
    merchantMobile: "",
    merchantEmail: "",
    company: companyId || "",
    address: "",
    campaignId: campaignId || "",
    latitude: null,
    longitude: null,
  }

  const [showTypewriter, setShowTypewriter] = useState(true);
  const [formData, setFormData] = useState<FormData>(initialFormState)
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)
  const [locationLoading, setLocationLoading] = useState<boolean>(true)
  const [merchantData, setMerchantData] = useState<ApiResponse["merchant"] | null>(null)
  const [step, setStep] = useState<number>(1)
  const [locationError, setLocationError] = useState<string>("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string>("")
  const [qrLoading, setQrLoading] = useState<boolean>(false)

  const detectLocation = async () => {
    setLocationError("")

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser")
      setLocationLoading(false)
      return
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject)
      })

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${position.coords.latitude}&lon=${position.coords.longitude}&format=json`,
      )
      const data = await response.json()

      const address = data.display_name || "Address not found"

      setFormData((prev) => ({
        ...prev,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        address: address,
      }))
    } catch (error) {
      if (error instanceof GeolocationPositionError) {
        if (error.code === 1) {
          setLocationError("Please enable location access to proceed")
        } else {
          setLocationError("Error getting location. Please allow location access and refresh the page")
        }
      } else {
        setLocationError("Failed to get address from coordinates")
      }
    } finally {
      setLocationLoading(false)
    }
  }

  useEffect(() => {
    if (!campaignId) {
      setError("Campaign ID is required")
    }
    detectLocation()
  }, [campaignId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value.trim(),
    }))
    setError("")
  }

  const validateMobile = (mobile: string): boolean => {
    return /^\d{10}$/.test(mobile)
  }

  const validateUPI = (upi: string): boolean => {
    return /^[\w.-]+@[\w.-]+$/.test(upi)
  }

  const validateStep1 = (): boolean => {
    if (!formData.merchantName.trim()) {
      setError("Merchant name is required")
      return false
    }
    if (!formData.merchantMobile.trim()) {
      setError("Mobile number is required")
      return false
    }
    if (!validateMobile(formData.merchantMobile)) {
      setError("Please enter a valid 10-digit mobile number")
      return false
    }
    if (!formData.latitude || !formData.longitude) {
      setError("Location access is required to proceed. Please enable location sharing and refresh the page")
      return false
    }
    return true
  }

  const validateStep2 = (): boolean => {
    if (!formData.upiId.trim()) {
      setError("UPI ID is required")
      return false
    }
    if (!validateUPI(formData.upiId)) {
      setError("Please enter a valid UPI ID")
      return false
    }
    if (!formData.company.trim()) {
      setError("Company name is required")
      return false
    }
    if (!formData.campaignId) {
      setError("Campaign ID is missing")
      return false
    }
    return true
  }

  const generateQRForDisplay = async (link: string) => {
    setQrLoading(true)
    try {
      const qrDataUrl = await qrcode.toDataURL(link, {
        errorCorrectionLevel: "H",
        margin: 1,
        width: 400,
      })
      setQrDataUrl(qrDataUrl)
    } catch (err) {
      console.error("Error generating QR for display:", err)
      setError("Failed to generate QR code display")
    } finally {
      setQrLoading(false)
    }
  }

  const generateMerchantQR = async () => {
    if (!merchantData?.qrLink) {
      setError("QR link is missing")
      return
    }

    try {
      const link = document.createElement("a")
      link.href = qrDataUrl
      link.download = `${merchantData.merchantName}_qr.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      setSuccess("QR code has been downloaded!")
    } catch (err) {
      console.error("Error downloading QR:", err)
      setError(err instanceof Error ? err.message : "Failed to download QR code")
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setMerchantData(null)
    setQrDataUrl("")

    if (step === 1) {
      if (validateStep1()) {
        setStep(2)
      }
      return
    }

    if (!validateStep2()) return

    setLoading(true)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_BOUNTY_URL
      if (!apiUrl) {
        throw new Error("API URL is not configured")
      }

      const response = await fetch(`${apiUrl}/api/merchant/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data: ApiResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to create merchant")
      }

      setSuccess("Merchant created successfully!")
      setMerchantData(data.merchant || null)

      if (data.merchant?.qrLink) {
        await generateQRForDisplay(data.merchant.qrLink)
      }

      setFormData(initialFormState)
      setStep(1)
      setIsDialogOpen(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error in creating merchant")
    } finally {
      setLoading(false)
    }
  }

  if (showTypewriter) {
    return <TypewriterText onComplete={() => setShowTypewriter(false)} />;
  }

  return (
    <div className="min-h-screen p-4 bg-[#151823] text-white flex flex-col">
      <div className="max-w-6xl mx-auto w-full mb-8">
        <h1 className="text-4xl font-bold text-center mb-2 mt-10 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Welcome to Bounty App
        </h1>
      </div>

      <div className="max-w-2xl mx-auto w-full">
        <div className="bg-[#1c1f2e] rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-center mb-8 text-white">Merchant Registration</h2>

          {error && <div className="mb-6 p-4 bg-red-900/50 border border-red-500/50 text-red-200 rounded-lg">{error}</div>}
          {success && (
            <div className="mb-6 p-4 bg-green-900/50 border border-green-500/50 text-green-200 rounded-lg">{success}</div>
          )}
          {locationError && (
            <div className="mb-6 p-4 bg-yellow-900/50 border border-yellow-500/50 text-yellow-200 rounded-lg">
              {locationError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <label htmlFor="merchantName" className="block text-sm font-medium text-gray-300">
                    Merchant Name *
                  </label>
                  <input
                    type="text"
                    id="merchantName"
                    name="merchantName"
                    value={formData.merchantName}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 bg-[#262837] text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter merchant name"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="merchantMobile" className="block text-sm font-medium text-gray-300">
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
                    className="w-full px-3 py-2 bg-[#262837] text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter 10-digit mobile number"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">Location *</label>
                  {formData.address && (
                    <div className="p-3 bg-[#262837] rounded-lg border border-gray-700">
                      <div className="flex items-center gap-2 text-gray-300">
                        <MapPin className="h-4 w-4" />
                        <p className="text-sm">{formData.address}</p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {step === 2 && (
              <div className="space-y-2">
                <label htmlFor="upiId" className="block text-sm font-medium text-gray-300">
                  UPI ID *
                </label>
                <input
                  type="text"
                  id="upiId"
                  name="upiId"
                  value={formData.upiId}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 bg-[#262837] text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter UPI ID (e.g., name@bank)"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !campaignId || locationLoading}
              className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-[#1c1f2e] disabled:opacity-50 transition-all duration-200"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin inline-block mr-2 h-4 w-4" />
                  {step === 2 ? "Adding Merchant..." : "Proceeding..."}
                </>
              ) : step === 1 ? (
                "Next"
              ) : (
                "Add Merchant"
              )}
            </button>
          </form>
        </div>
      </div>

      {isDialogOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#1c1f2e] p-8 rounded-xl shadow-xl max-w-md w-full relative overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 animate-pulse" />
            </div>

            <h3 className="text-2xl font-bold mb-4 text-white relative z-10">Congratulations! 🎉</h3>
            <p className="mb-6 text-gray-300 relative z-10">Your merchant account has been successfully created.</p>

            <div className="rounded-lg p-4 mb-6 relative z-10 shadow-inner">
              <div className="flex justify-center">
                {qrLoading ? (
                  <div className="w-48 h-48 flex items-center justify-center">
                    <Loader2 className="animate-spin h-8 w-8 text-purple-500" />
                  </div>
                ) : qrDataUrl ? (
                  <img
                    src={qrDataUrl || "/placeholder.svg"}
                    alt="Merchant QR Code"
                    className="w-48 h-48 object-contain bg-white p-2 rounded-lg transition-all duration-300 hover:scale-105"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-gray-400 text-center">
                    QR code not available
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4 relative z-10">
              <button
                onClick={generateMerchantQR}
                disabled={!qrDataUrl || qrLoading}
                className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-[#1c1f2e] disabled:opacity-50 transition-all duration-200 transform hover:scale-105"
              >
                {qrLoading ? <Loader2 className="animate-spin inline-block h-4 w-4" /> : "Download QR Code"}
              </button>
              <button
                onClick={() => {
                  setIsDialogOpen(false)
                  setQrDataUrl("")
                }}
                className="w-full px-4 py-2 bg-[#262837] text-gray-300 rounded-lg hover:bg-[#2a2d3d] focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-[#1c1f2e] transition-all duration-200 transform hover:scale-105"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FormLoader() {
  return (
    <div className="min-h-screen p-4 bg-[#151823] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="animate-spin h-12 w-12 text-purple-500 mx-auto" />
        <p className="mt-4 text-gray-400">Loading form...</p>
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