"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { assignmentService } from "@/lib/api/assignment";
import { submissionService } from "@/lib/api/submission";
import { Upload, X, FileText, AlertCircle, CheckCircle, Calendar, BookOpen, User } from "lucide-react";

export default function SubmitAssignmentPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const assignmentId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [assignment, setAssignment] = useState<any>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [userInfo, setUserInfo] = useState<any>(null);

  const schoolId = searchParams.get("school");
  const subjectId = searchParams.get("subject");

  useEffect(() => {
    // Get user info from localStorage
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        setUserInfo(JSON.parse(userStr));
      } catch (error) {
        console.error("Error parsing user:", error);
      }
    }

    if (!schoolId || !subjectId || !assignmentId) {
      setError("Missing required parameters");
      setLoading(false);
      return;
    }

    loadAssignment();
  }, [schoolId, subjectId, assignmentId]);

  const loadAssignment = async () => {
    try {
      setLoading(true);
      const data = await assignmentService.getById(
        parseInt(schoolId!),
        parseInt(subjectId!),
        parseInt(assignmentId)
      );
      
      // Check if deadline has passed
      const now = new Date();
      const deadline = new Date(data.deadline);
      if (deadline < now) {
        setError("Submission deadline has passed. You can no longer submit this assignment.");
      }
      
      setAssignment(data);
    } catch (err: any) {
      setError(err.message || "Failed to load assignment");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    // Validate file size (max 10MB each)
    const maxSize = 10 * 1024 * 1024; // 10MB
    const oversized = selectedFiles.find(file => file.size > maxSize);
    
    if (oversized) {
      setError(`File "${oversized.name}" exceeds 10MB limit`);
      return;
    }
    
    // Validate file types
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png',
      'application/zip',
      'application/x-rar-compressed'
    ];
    
    const invalidType = selectedFiles.find(file => !allowedTypes.includes(file.type));
    if (invalidType) {
      setError(`File type not allowed: ${invalidType.name}`);
      return;
    }
    
    setFiles(prev => [...prev, ...selectedFiles]);
    setError("");
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!schoolId || !subjectId || !assignmentId) {
      setError("Missing required parameters");
      return;
    }

    if (files.length === 0) {
      setError("Please select at least one file");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      // Prepare form data - SESUAI DENGAN LARAVEL
      const formData = new FormData();
      
      // Laravel expects 'files[]' for multiple files
      files.forEach(file => {
        formData.append('files[]', file); // PENTING: files[] bukan files
      });
      
      // Jika Laravel menerima comment, tambahkan
      if (comment.trim()) {
        // Cek dulu apakah Laravel menerima field 'comment'
        // Kalau tidak ada di validation rules, hapus ini
        formData.append('comment', comment);
      }

      console.log('📤 Submitting form data:', {
        schoolId,
        subjectId,
        assignmentId,
        fileCount: files.length,
        hasComment: !!comment.trim()
      });

      // Submit to API
      const response = await submissionService.submit(
        parseInt(schoolId),
        parseInt(subjectId),
        parseInt(assignmentId),
        formData
      );

      console.log('✅ Submit response:', response);

      setSuccess("Assignment submitted successfully!");
      
      // Redirect to submissions page after 2 seconds
      setTimeout(() => {
        router.push(`/submissions?school=${schoolId}&subject=${subjectId}&assignment=${assignmentId}`);
      }, 2000);

    } catch (err: any) {
      console.error("Submit error details:", err);
      
      let errorMessage = "Failed to submit assignment";
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.errors) {
        // Handle validation errors from Laravel
        const errors = err.response.data.errors;
        errorMessage = Object.values(errors).flat().join(', ');
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assignment...</p>
        </div>
      </div>
    );
  }

  if (error && !assignment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-800 mb-2">Error</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push("/assignments")}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Back to Assignments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/assignments")}
            className="text-gray-600 hover:text-gray-900 mb-4 inline-flex items-center gap-2"
          >
            ← Back to Assignments
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Submit Assignment</h1>
          <p className="text-gray-600 mt-1">Submit your work for grading</p>
        </div>

        {/* Student Info */}
        {userInfo && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <User className="text-blue-600" size={20} />
              <div>
                <p className="font-medium text-blue-800">{userInfo.name}</p>
                <p className="text-sm text-blue-600">ID: {userInfo.id} • Role: {userInfo.roles?.[0]?.name || 'Student'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Assignment Info */}
        <div className="bg-white rounded-lg border p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="text-blue-600" size={24} />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">{assignment?.name}</h2>
              <p className="text-gray-600 mt-1">{assignment?.description}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-sm">
                <div className="flex items-center gap-2">
                  <BookOpen size={16} className="text-gray-400" />
                  <div>
                    <p className="text-gray-500">Subject</p>
                    <p className="font-medium">{assignment?.subject?.name || 'Unknown'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-gray-400" />
                  <div>
                    <p className="text-gray-500">Deadline</p>
                    <p className="font-medium">{formatDate(assignment?.deadline)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-gray-500">Status</p>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    new Date(assignment?.deadline) < new Date() 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {new Date(assignment?.deadline) < new Date() ? 'Closed' : 'Active'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="text-green-600" size={20} />
              <div>
                <p className="text-green-800 font-medium">{success}</p>
                <p className="text-green-700 text-sm mt-1">Redirecting to submissions page...</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && !success && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-red-600" size={20} />
              <div>
                <p className="text-red-800 font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Submission Form */}
        {!success && (
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Submission Details</h3>
            
            {/* File Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Files <span className="text-red-500">*</span>
                <span className="text-gray-500 text-sm ml-2">(Max 10MB per file)</span>
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Drag & drop files here or click to browse</p>
                <p className="text-sm text-gray-500 mb-4">
                  Supported: PDF, DOC, DOCX, TXT, JPG, PNG, ZIP, RAR
                </p>
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                  name="files[]" // PENTING: Sesuai dengan Laravel
                />
                <label
                  htmlFor="file-upload"
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                >
                  Browse Files
                </label>
              </div>
              
              {/* File List */}
              {files.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Selected Files ({files.length})
                  </p>
                  <div className="space-y-2">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="text-gray-400" size={16} />
                          <div>
                            <p className="text-gray-900 text-sm">{file.name}</p>
                            <p className="text-gray-500 text-xs">
                              {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="text-gray-400 hover:text-red-600"
                          type="button"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Comment - OPSIONAL: Sesuai dengan Laravel */}
            {/* 
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Comments (Optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add any comments about your submission..."
                className="w-full h-32 p-3 border rounded-lg text-gray-900"
                rows={4}
              />
            </div>
            */}

            {/* Submit Button */}
            <div className="flex gap-3">
              <button
                onClick={() => router.push("/assignments")}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={submitting}
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || files.length === 0 || new Date(assignment?.deadline) < new Date()}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                type="button"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    Submit Assignment
                  </>
                )}
              </button>
            </div>

            {/* Deadline Warning */}
            {assignment && new Date(assignment.deadline) < new Date() && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertCircle size={16} />
                  <p className="text-sm font-medium">Submission closed. Deadline has passed.</p>
                </div>
              </div>
            )}

            {/* Debug Info */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
                <details>
                  <summary className="cursor-pointer font-medium text-sm">Debug Information</summary>
                  <div className="mt-2 text-xs">
                    <p>School ID: {schoolId}</p>
                    <p>Subject ID: {subjectId}</p>
                    <p>Assignment ID: {assignmentId}</p>
                    <p>Files count: {files.length}</p>
                    <p>Deadline: {assignment?.deadline}</p>
                    <p>Now: {new Date().toISOString()}</p>
                  </div>
                </details>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}