"use client";

import { useState } from "react";

export default function AddReviewersButton({ cycleId }: { cycleId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [reviewerType, setReviewerType] = useState<"PEER" | "PARENT_STUDENT">("PEER");
  const [selectedReviewers, setSelectedReviewers] = useState<string[]>([]);
  const [availableReviewers, setAvailableReviewers] = useState<
    Array<{ id: string; name: string; email: string; type: string }>
  >([]);

  const handleOpen = async () => {
    setIsOpen(true);
    setSelectedReviewers([]);
    setMessage("");
    setReviewerType("PEER");
    
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
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-lg max-w-md w-full mx-4">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Add Reviewers to Cycle
            </h2>

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

            {/* Message */}
            {message && (
              <div className={`mb-4 p-3 rounded-lg text-sm ${
                message.startsWith("✅")
                  ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                  : "bg-rose-50 text-rose-900 border border-rose-200"
              }`}>
                {message}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
                className="flex-1 px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 font-medium hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddReviewers}
                disabled={isLoading || selectedReviewers.length === 0}
                className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? "Adding..." : "Add & Send Invites"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
