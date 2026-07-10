"use client";

import { useState, FormEvent } from "react";

export default function AddReviewersButton({ cycleId }: { cycleId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [reviewerType, setReviewerType] = useState<"PEER" | "PARENT_STUDENT">("PEER");
  const [selectedReviewers, setSelectedReviewers] = useState<string[]>([]);
  const [availableReviewers, setAvailableReviewers] = useState<
    Array<{ id: string; name: string; email: string; type: string }>
  >([]);
  const [tab, setTab] = useState<"existing" | "create">("existing");
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    studentName: "",
    contactType: "PARENT" as "PARENT" | "STUDENT",
  });

  const handleOpen = async () => {
    setIsOpen(true);
    setSelectedReviewers([]);
    setMessage("");
    setReviewerType("PEER");
    setTab("existing");
    
    // Fetch available reviewers (users or contacts)
    try {
      const response = await fetch(
        `/api/admin/available-reviewers?type=${reviewerType}&cycleId=${cycleId}`
      );
      if (response.ok) {
        const data = await response.json();
        setAvailableReviewers(data.reviewers || []);
      }
    } catch (error) {
      console.error("Failed to fetch available reviewers:", error);
    }
  };

  const handleTypeChange = async (type: "PEER" | "PARENT_STUDENT") => {
    setReviewerType(type);
    setSelectedReviewers([]);
    setMessage("");

    // Fetch new list of reviewers for this type
    try {
      const response = await fetch(
        `/api/admin/available-reviewers?type=${type}&cycleId=${cycleId}`
      );
      if (response.ok) {
        const data = await response.json();
        setAvailableReviewers(data.reviewers || []);
      }
    } catch (error) {
      console.error("Failed to fetch available reviewers:", error);
    }
  };

  const handleCreateContact = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsCreating(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/contacts", {
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

      const data = await response.json();

      if (!response.ok) {
        setMessage(`Error: ${data.error || "Failed to create contact"}`);
        return;
      }

      // Add the new contact to selected reviewers
      setSelectedReviewers([...selectedReviewers, data.contact.id]);
      setMessage(`✅ Created ${formData.name}. They've been added to the selection.`);

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        studentName: "",
        contactType: "PARENT",
      });

      // Refresh available reviewers
      setTimeout(() => {
        handleTypeChange(reviewerType);
      }, 500);
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddReviewers = async () => {
    if (selectedReviewers.length === 0) {
      setMessage("Please select at least one reviewer");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/admin/evaluations/${cycleId}/add-reviewers`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reviewerIds: selectedReviewers,
            type: reviewerType,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(`Error: ${data.error || "Failed to add reviewers"}`);
        return;
      }

      setMessage(
        `✅ Added ${data.added} reviewer${data.added !== 1 ? "s" : ""}. Invitations sent.${
          data.errors?.length ? " Some errors occurred: " + data.errors.join("; ") : ""
        }`
      );
      setSelectedReviewers([]);

      // Refresh page after 2 seconds
      setTimeout(() => {
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
        onClick={handleOpen}
        className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50"
      >
        + Add More Reviewers
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Add Reviewers to Cycle
            </h2>

            {/* Tabs */}
            <div className="flex gap-2 mb-4 border-b border-slate-200">
              <button
                onClick={() => {
                  setTab("existing");
                  setMessage("");
                }}
                className={`px-3 py-2 text-sm font-medium border-b-2 transition ${
                  tab === "existing"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                Select Existing
              </button>
              <button
                onClick={() => {
                  setTab("create");
                  setMessage("");
                }}
                className={`px-3 py-2 text-sm font-medium border-b-2 transition ${
                  tab === "create"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                Create New
              </button>
            </div>

            {/* Tab Content */}
            {tab === "existing" ? (
              <>
                {/* Reviewer Type Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Reviewer Type
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleTypeChange("PEER")}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        reviewerType === "PEER"
                          ? "bg-blue-100 text-blue-900 border border-blue-300"
                          : "bg-slate-100 text-slate-900 border border-slate-300 hover:bg-slate-200"
                      }`}
                    >
                      Peer
                    </button>
                    <button
                      onClick={() => handleTypeChange("PARENT_STUDENT")}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        reviewerType === "PARENT_STUDENT"
                          ? "bg-blue-100 text-blue-900 border border-blue-300"
                          : "bg-slate-100 text-slate-900 border border-slate-300 hover:bg-slate-200"
                      }`}
                    >
                      Parent/Student
                    </button>
                  </div>
                </div>

                {/* Reviewer Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Select Reviewers
                  </label>
                  <div className="border border-slate-200 rounded-lg max-h-64 overflow-y-auto">
                    {availableReviewers.length === 0 ? (
                      <p className="p-3 text-sm text-slate-500">
                        No available reviewers of this type
                      </p>
                    ) : (
                      <div className="space-y-1">
                        {availableReviewers.map((reviewer) => (
                          <label
                            key={reviewer.id}
                            className="flex items-center gap-2 p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0"
                          >
                            <input
                              type="checkbox"
                              checked={selectedReviewers.includes(reviewer.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedReviewers([...selectedReviewers, reviewer.id]);
                                } else {
                                  setSelectedReviewers(
                                    selectedReviewers.filter((id) => id !== reviewer.id)
                                  );
                                }
                              }}
                              className="rounded border-slate-300"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-slate-900 truncate">
                                {reviewer.name}
                              </p>
                              <p className="text-xs text-slate-500 truncate">
                                {reviewer.email}
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    {selectedReviewers.length} selected
                  </p>
                </div>
              </>
            ) : (
              <>
                {/* Create New Contact Form */}
                <form onSubmit={handleCreateContact} className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-1">
                      Contact Type
                    </label>
                    <select
                      value={formData.contactType}
                      onChange={(e) =>
                        setFormData({ ...formData, contactType: e.target.value as "PARENT" | "STUDENT", studentName: "" })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    >
                      <option value="PARENT">Parent</option>
                      <option value="STUDENT">Student</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-1">
                      Name
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
                      Email
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
                      Phone (optional)
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
                        required
                      />
                      <p className="text-xs text-slate-500 mt-1">Required for parent contacts</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isCreating || (formData.contactType === "PARENT" && !formData.studentName)}
                    className="w-full mt-4 px-4 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50"
                  >
                    {isCreating ? "Creating..." : "✓ Create & Add"}
                  </button>
                </form>
              </>
            )}

            {/* Message */}
            {message && (
              <div className={`mt-4 p-3 rounded-lg text-sm ${
                message.startsWith("✅")
                  ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                  : "bg-rose-50 text-rose-900 border border-rose-200"
              }`}>
                {message}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setIsOpen(false)}
                disabled={isLoading || isCreating}
                className="flex-1 px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 font-medium hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              {tab === "existing" && (
                <button
                  onClick={handleAddReviewers}
                  disabled={isLoading || selectedReviewers.length === 0}
                  className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? "Adding..." : "Add & Send Invites"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
