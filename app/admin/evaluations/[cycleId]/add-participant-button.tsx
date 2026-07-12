"use client";

import { useState, FormEvent } from "react";

export default function AddParticipantButton({ cycleId }: { cycleId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    studentName: "",
    contactType: "PARENT" as "PARENT" | "STUDENT",
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      // Step 1: Create new contact
      const contactResponse = await fetch("/api/admin/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          studentName: formData.studentName,
          type: formData.contactType,
        }),
      });

      const contactData = await contactResponse.json();

      if (!contactResponse.ok) {
        setMessage(`Error creating contact: ${contactData.error || "Unknown error"}`);
        setIsLoading(false);
        return;
      }

      // Step 2: Add contact to cycle as PARENT_STUDENT reviewer
      const addReviewerResponse = await fetch(
        `/api/admin/evaluations/${cycleId}/add-reviewers`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reviewerIds: [contactData.contact.id],
            type: "PARENT_STUDENT",
          }),
        }
      );

      const addReviewerData = await addReviewerResponse.json();

      if (!addReviewerResponse.ok) {
        setMessage(`Error adding to cycle: ${addReviewerData.error || "Unknown error"}`);
        setIsLoading(false);
        return;
      }

      setMessage(
        `✅ Participant added! Email and SMS invitation sent to ${formData.name}.`
      );

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        studentName: "",
        contactType: "PARENT",
      });

      // Close modal and refresh after 2 seconds
      setTimeout(() => {
        setIsOpen(false);
        window.location.reload();
      }, 2000);
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => {
          setIsOpen(true);
          setMessage("");
          setFormData({
            name: "",
            email: "",
            phone: "",
            studentName: "",
            contactType: "PARENT",
          });
        }}
        className="block w-full text-left rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-950"
      >
        Add Participant
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Add New Participant
            </h2>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Participant Type
                </label>
                <select
                  value={formData.contactType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contactType: e.target.value as "PARENT" | "STUDENT",
                      studentName: "",
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  required
                >
                  <option value="PARENT">Parent</option>
                  <option value="STUDENT">Student</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">
                  Full Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., John Smith"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">
                  Email <span className="text-rose-600">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">
                  Phone Number (optional)
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              {formData.contactType === "PARENT" && (
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1">
                    Student Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.studentName}
                    onChange={(e) =>
                      setFormData({ ...formData, studentName: e.target.value })
                    }
                    placeholder="Name of student"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    required={formData.contactType === "PARENT"}
                  />
                  <p className="text-xs text-slate-500 mt-1">Required for parent contacts</p>
                </div>
              )}

              {/* Message */}
              {message && (
                <div
                  className={`p-3 rounded-lg text-sm ${
                    message.startsWith("✅")
                      ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                      : "bg-rose-50 text-rose-900 border border-rose-200"
                  }`}
                >
                  {message}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 font-medium hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    isLoading ||
                    !formData.name ||
                    !formData.email ||
                    (formData.contactType === "PARENT" && !formData.studentName)
                  }
                  className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? "Adding..." : "Add Participant"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
