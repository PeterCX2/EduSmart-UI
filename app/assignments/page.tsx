"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { schoolService } from "@/lib/api/schoolService";
import { subjectService } from "@/lib/api/subject";
import { assignmentService } from "@/lib/api/assignment";
import { submissionService } from "@/lib/api/submission";
import {
  Edit,
  Trash2,
  Plus,
  RefreshCw,
  Search,
  Calendar,
  FileText,
  Upload,
  AlertCircle,
  Users,
  BookOpen,
  Clock,
  CheckCircle,
  Eye,
  CheckCheck,
  Award,
  MessageSquare,
  X,
  Star,
  Download,
  User,
  Mail,
} from "lucide-react";

export default function AssignmentsPage() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [userInfo, setUserInfo] = useState({
    role: "",
    schoolId: null as number | null,
    userId: null as number | null,
    schoolName: "",
    subjects: [] as any[],
  });
  const [debug, setDebug] = useState("");
  
  // State untuk popup
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [showSubmissionDetail, setShowSubmissionDetail] = useState(false);
  const [showGradeForm, setShowGradeForm] = useState(false);
  const [grading, setGrading] = useState(false);
  const [grade, setGrade] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>("");

  useEffect(() => {
    const loadUserInfo = () => {
      try {
        const userStr = localStorage.getItem("user");
        if (!userStr) {
          router.push("/login");
          return;
        }

        const user = JSON.parse(userStr);

        // Extract role
        let role = "";
        if (user.roles && user.roles.length > 0) {
          role = user.roles[0].name;
        } else if (user.role) {
          role = user.role;
        }

        // Extract school info
        let schoolId = null;
        let schoolName = "";

        if (user.school_id) {
          schoolId = user.school_id;
        } else if (user.schools && user.schools.length > 0) {
          if (typeof user.schools[0] === 'object') {
            schoolId = user.schools[0].id;
            schoolName = user.schools[0].name;
          } else {
            schoolId = user.schools[0];
          }
        }

        // Extract subjects
        let subjects: any[] = [];
        if (user.subjects && Array.isArray(user.subjects)) {
          subjects = user.subjects.map((subj: any) => {
            if (typeof subj === 'object') {
              return {
                id: subj.id,
                name: subj.name,
                ...subj
              };
            } else {
              return {
                id: subj,
                name: `Subject ${subj}`
              };
            }
          });
        }

        setUserInfo({
          role,
          schoolId,
          userId: user.id,
          schoolName,
          subjects
        });

        setDebug(`Loaded: ${role} | School: ${schoolName || schoolId} | Subjects: ${subjects.length}`);

      } catch (error) {
        console.error("Error loading user info:", error);
        setDebug("Error parsing user data");
      }
    };

    loadUserInfo();
  }, [router]);

  useEffect(() => {
    if (userInfo.role) {
      if (userInfo.role === 'super-admin' || (userInfo.schoolId !== null && userInfo.userId)) {
        loadAssignments();
      }
    }
  }, [userInfo]);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      setAssignments([]);
      setSubmissions([]);
      
      const { role, schoolId, schoolName, subjects, userId } = userInfo;
      
      console.log("Loading assignments for:", { role, schoolId, userId });

      const allAssignments: any[] = [];

      // STUDENT FLOW
      if (role === "student") {
        if (!schoolId || !userId) {
          setDebug("No school ID or user ID found");
          return;
        }

        try {
          // Get school name
          let currentSchoolName = schoolName;
          if (!currentSchoolName) {
            try {
              const schoolData = await schoolService.getById(schoolId);
              currentSchoolName = schoolData.name;
            } catch (err) {
              currentSchoolName = `School ${schoolId}`;
            }
          }

          // Get all subjects in the school
          const allSchoolSubjects = await subjectService.getBySchool(schoolId);
          
          // Filter subjects based on user's subjects
          let studentSubjects = allSchoolSubjects;
          if (subjects.length > 0) {
            const subjectIds = subjects.map((s: any) => s.id);
            studentSubjects = allSchoolSubjects.filter((subject: any) => 
              subjectIds.includes(subject.id)
            );
          }

          // Get assignments for each subject
          for (const subject of studentSubjects) {
            try {
              const assignments = await assignmentService.getBySubject(schoolId, subject.id);
              
              // Get submissions for each assignment to check if student already submitted
              for (const assignment of assignments) {
                try {
                  // Get student's submissions for this assignment
                  const assignmentSubmissions = await submissionService.getByAssignment(schoolId, subject.id, assignment.id);
                  const studentSubmission = assignmentSubmissions.find((s: any) => s.user_id === userId);
                  
                  const now = new Date();
                  const deadline = new Date(assignment.deadline);
                  const isDeadlinePassed = deadline < now;
                  const hasSubmitted = !!studentSubmission;
                  const canSubmit = !isDeadlinePassed && !hasSubmitted;
                  
                  allAssignments.push({
                    ...assignment,
                    school_id: schoolId,
                    school_name: currentSchoolName,
                    subject_id: subject.id,
                    subject_name: subject.name,
                    subject_description: subject.description,
                    can_submit: canSubmit,
                    deadline_passed: isDeadlinePassed,
                    has_submitted: hasSubmitted,
                    submission: studentSubmission, // Simpan submission lengkap
                    submission_id: studentSubmission?.id,
                    submission_status: studentSubmission?.status,
                    submission_grade: studentSubmission?.grade,
                    submission_date: studentSubmission?.submitted_at,
                    hours_until_deadline: Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60)),
                    formatted_deadline: deadline.toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }),
                  });
                  
                  // Store submission info separately
                  if (studentSubmission) {
                    setSubmissions(prev => [...prev, {
                      ...studentSubmission,
                      assignment_id: assignment.id,
                      assignment_name: assignment.name,
                      assignment_description: assignment.description,
                      subject_name: subject.name
                    }]);
                  }
                  
                } catch (err) {
                  console.error(`Error checking submission for assignment ${assignment.id}:`, err);
                }
              }
            } catch (err) {
              console.error(`Error loading assignments for subject ${subject.id}:`, err);
            }
          }

        } catch (err) {
          console.error("Error in student flow:", err);
          setDebug(`Error: ${err.message}`);
        }
      }
      
      // TEACHER FLOW
      else if (role === "teacher") {
        if (!schoolId) {
          setDebug("Teacher tidak memiliki school ID");
          return;
        }

        try {
          // Get school name
          let currentSchoolName = schoolName;
          if (!currentSchoolName) {
            try {
              const schoolData = await schoolService.getById(schoolId);
              currentSchoolName = schoolData.name;
            } catch (err) {
              currentSchoolName = `Sekolah ${schoolId}`;
            }
          }

          // Get teacher's subjects
          const allSchoolSubjects = await subjectService.getBySchool(schoolId);
          let teacherSubjects = allSchoolSubjects;
          
          if (subjects.length > 0) {
            const subjectIds = subjects.map((s: any) => s.id);
            teacherSubjects = allSchoolSubjects.filter((subject: any) => 
              subjectIds.includes(subject.id)
            );
          }

          // Get assignments
          for (const subject of teacherSubjects) {
            try {
              const assignments = await assignmentService.getBySubject(schoolId, subject.id);
              
              assignments.forEach((assignment: any) => {
                const now = new Date();
                const deadline = new Date(assignment.deadline);
                const deadlinePassed = deadline < now;
                
                allAssignments.push({
                  ...assignment,
                  school_id: schoolId,
                  school_name: currentSchoolName,
                  subject_id: subject.id,
                  subject_name: subject.name,
                  deadline_passed: deadlinePassed,
                  formatted_deadline: deadline.toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }),
                  created_by_name: assignment.created_by_user?.name || assignment.created_by || "Unknown"
                });
              });
            } catch (err) {
              console.error(`Error loading assignments for subject ${subject.id}:`, err);
            }
          }
        } catch (err) {
          console.error("Error in teacher flow:", err);
        }
      }

      // SUPER ADMIN FLOW
      else if (role === "super-admin") {
        try {
          const schools = await schoolService.getAll();
          
          for (const school of schools) {
            try {
              const subjects = await subjectService.getBySchool(school.id);
              
              for (const subject of subjects) {
                try {
                  const assignments = await assignmentService.getBySubject(school.id, subject.id);
                  
                  assignments.forEach((assignment: any) => {
                    const now = new Date();
                    const deadline = new Date(assignment.deadline);
                    const deadlinePassed = deadline < now;
                    
                    allAssignments.push({
                      ...assignment,
                      school_id: school.id,
                      school_name: school.name,
                      subject_id: subject.id,
                      subject_name: subject.name,
                      deadline_passed: deadlinePassed,
                      formatted_deadline: deadline.toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }),
                      created_by_name: assignment.created_by_user?.name || assignment.created_by || "Unknown"
                    });
                  });
                } catch (err) {
                  console.error(`Error loading assignments for subject ${subject.id}:`, err);
                }
              }
            } catch (err) {
              console.error(`Error loading subjects for school ${school.id}:`, err);
            }
          }
        } catch (err) {
          console.error("Error in super-admin flow:", err);
        }
      }

      // Sort by deadline (soonest first)
      const sortedAssignments = allAssignments.sort((a, b) => 
        new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      );

      setAssignments(sortedAssignments);
      
      const debugMsg = [
        `Loaded ${sortedAssignments.length} assignments`,
        `Role: ${role}`,
        `School: ${userInfo.schoolName || `ID: ${schoolId}`}`,
        `User ID: ${userId}`,
        `Submissions found: ${submissions.length}`,
        `--- Summary ---`,
        `Can submit: ${sortedAssignments.filter(a => a.can_submit).length}`,
        `Already submitted: ${sortedAssignments.filter(a => a.has_submitted).length}`,
        `Closed (deadline passed): ${sortedAssignments.filter(a => a.deadline_passed).length}`
      ].join('\n');
      
      setDebug(debugMsg);

    } catch (e: any) {
      console.error("Error loading assignments:", e);
      setDebug(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (
    schoolId: number,
    subjectId: number,
    assignmentId: number,
    name: string
  ) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await assignmentService.delete(schoolId, subjectId, assignmentId);
      loadAssignments();
    } catch (error) {
      console.error("Error deleting assignment:", error);
      alert("Failed to delete assignment");
    }
  };

  const handleGradeSubmit = async () => {
    if (!selectedSubmission || !userInfo.schoolId || !selectedSubmission.assignment_id) return;

    try {
      setGrading(true);
      
      // Find subject_id from assignment
      const assignment = assignments.find(a => a.id === selectedSubmission.assignment_id);
      if (!assignment) {
        alert("Assignment not found");
        return;
      }

      await submissionService.grade(
        userInfo.schoolId,
        assignment.subject_id,
        selectedSubmission.assignment_id,
        selectedSubmission.id,
        { grade }
      );

      if (feedback.trim() !== '') {
        await submissionService.saveFeedback(
          userInfo.schoolId,
          assignment.subject_id,
          selectedSubmission.assignment_id,
          selectedSubmission.id,
          { feedback }
        );
      }

      alert("Grade and feedback saved successfully");
      setShowGradeForm(false);
      loadAssignments(); // Reload data
      
    } catch (error: any) {
      console.error("Error grading submission:", error);
      alert(error.message || "Failed to save grade");
    } finally {
      setGrading(false);
    }
  };

  const handleViewSubmissionDetail = (assignment: any) => {
    if (assignment.has_submitted && assignment.submission) {
      setSelectedSubmission(assignment.submission);
      setShowSubmissionDetail(true);
      
      // Set grade and feedback for editing if teacher/admin
      if (userInfo.role === 'teacher' || userInfo.role === 'super-admin') {
        setGrade(assignment.submission_grade || 0);
        setFeedback(assignment.submission?.feedback?.feedback || '');
      }
    }
  };

  const handleGradeSubmission = (assignment: any) => {
    if (assignment.has_submitted && assignment.submission) {
      setSelectedSubmission(assignment.submission);
      setGrade(assignment.submission_grade || 0);
      setFeedback(assignment.submission?.feedback?.feedback || '');
      setShowGradeForm(true);
    }
  };

  const filteredAssignments = assignments.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.name?.toLowerCase().includes(q) ||
      item.subject_name?.toLowerCase().includes(q) ||
      item.school_name?.toLowerCase().includes(q)
    );
  });

  // Format time remaining
  const formatTimeRemaining = (hours: number) => {
    if (hours < 1) {
      const minutes = Math.floor(hours * 60);
      return `${minutes} menit`;
    } else if (hours < 24) {
      return `${Math.floor(hours)} jam`;
    } else {
      const days = Math.floor(hours / 24);
      return `${days} hari`;
    }
  };

  // Format submission date
  const formatSubmissionDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Download file function
  const downloadFile = (url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-10">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
          <p className="text-gray-600 mt-2">Loading assignments...</p>
          <p className="text-sm text-gray-500 mt-2">{debug}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-xl">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-4 text-gray-600">
              <div className="flex items-center gap-2">
                <Users size={16} />
                <span className="font-medium capitalize">{userInfo.role}</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen size={16} />
                <span>{userInfo.schoolName || `School ID: ${userInfo.schoolId}`}</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText size={16} />
                <span>{assignments.length} assignments</span>
                {userInfo.role === 'student' && (
                  <span className="text-sm text-green-600">
                    ({assignments.filter(a => a.can_submit).length} available)
                  </span>
                )}
              </div>
            </div>
            {process.env.NODE_ENV === 'development' && debug && (
              <div className="text-sm bg-gray-50 p-3 rounded mt-2 border">
                <details>
                  <summary className="cursor-pointer font-medium">Debug Information</summary>
                  <pre className="mt-2 whitespace-pre-wrap text-xs">{debug}</pre>
                </details>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={loadAssignments}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          
          {(userInfo.role === "super-admin" || userInfo.role === "teacher") && (
            <button
              onClick={() => {
                if (!userInfo.schoolId && userInfo.role !== "super-admin") {
                  alert("Please select a school first");
                  return;
                }
                router.push("/assignments/new");
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus size={18} />
              New Assignment
            </button>
          )}
        </div>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search assignments..."
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-gray-600"
          />
        </div>
      </div>

      {assignments.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <FileText size={32} className="mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600 mb-2">No assignments found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-left">
                <th className="p-3 text-gray-600">No</th>
                <th className="p-3 text-gray-600">Assignment Details</th>
                <th className="p-3 text-gray-600">Subject</th>
                <th className="p-3 text-gray-600">Deadline</th>
                <th className="p-3 text-gray-600">Status</th>
                {userInfo.role !== 'student' && <th className="p-3 text-gray-600">Submissions</th>}
                <th className="p-3 text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody className="text-gray-600">
              {filteredAssignments.map((item, index) => {
                const isGraded = item.submission_status === 'graded' || item.submission_grade !== null;
                
                return (
                  <tr key={item.id} className="border-t hover:bg-gray-50">
                    <td className="p-3">{index + 1}</td>
                    <td className="p-3">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          item.deadline_passed ? "bg-red-50" : 
                          item.has_submitted ? "bg-green-50" : 
                          item.can_submit ? "bg-blue-50" : "bg-gray-50"
                        }`}>
                          <FileText size={16} className={
                            item.deadline_passed ? "text-red-600" : 
                            item.has_submitted ? "text-green-600" : 
                            item.can_submit ? "text-blue-600" : "text-gray-600"
                          } />
                        </div>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          {item.description && (
                            <p className="text-sm text-gray-500 line-clamp-1">{item.description}</p>
                          )}
                          <div className="flex gap-2 mt-1">
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              item.deadline_passed 
                                ? "bg-red-100 text-red-800" 
                                : "bg-green-100 text-green-800"
                            }`}>
                              {item.deadline_passed ? 'Closed' : 'Active'}
                            </span>
                            {item.has_submitted && (
                              <span className={`px-2 py-0.5 rounded text-xs ${
                                isGraded 
                                  ? "bg-purple-100 text-purple-800" 
                                  : "bg-blue-100 text-blue-800"
                              }`}>
                                {isGraded ? `Graded` : 'Submitted'}
                              </span>
                            )}
                            {item.can_submit && item.hours_until_deadline && item.hours_until_deadline < 24 && (
                              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded text-xs flex items-center gap-1">
                                <Clock size={10} />
                                {formatTimeRemaining(item.hours_until_deadline)}
                              </span>
                            )}
                          </div>
                          {item.has_submitted && item.submission_date && (
                            <p className="text-xs text-gray-500 mt-1">
                              Submitted: {formatSubmissionDate(item.submission_date)}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <p className="font-medium">{item.subject_name}</p>
                      <p className="text-sm text-gray-500">ID: {item.subject_id}</p>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className={
                          item.deadline_passed ? "text-red-500" : 
                          item.can_submit ? "text-green-500" : "text-gray-500"
                        } />
                        <div>
                          <span className={
                            item.deadline_passed ? "text-red-600" : 
                            item.can_submit ? "text-green-600" : ""
                          }>
                            {item.formatted_deadline}
                          </span>
                          {item.can_submit && item.hours_until_deadline && (
                            <p className="text-xs text-gray-500 mt-1">
                              {formatTimeRemaining(item.hours_until_deadline)} remaining
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      {userInfo.role === 'student' ? (
                        <div className="flex flex-col">
                          {item.has_submitted ? (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCheck size={14} />
                              <span className="text-sm font-medium">Submitted</span>
                              {isGraded && (
                                <span className="text-xs bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded ml-1">
                                  {item.submission_grade}/100
                                </span>
                              )}
                            </div>
                          ) : item.can_submit ? (
                            <div className="flex items-center gap-1 text-blue-600">
                              <CheckCircle size={14} />
                              <span className="text-sm font-medium">Available</span>
                            </div>
                          ) : (
                            <div className="text-sm">
                              <span className={`font-medium ${
                                item.deadline_passed ? 'text-red-600' : 'text-gray-600'
                              }`}>
                                {item.deadline_passed ? 'Closed' : 'Not Available'}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className={`px-2 py-1 rounded text-xs ${
                          !item.deadline_passed 
                            ? "bg-green-100 text-green-800" 
                            : "bg-red-100 text-red-800"
                        }`}>
                          {item.deadline_passed ? "Closed" : "Active"}
                        </span>
                      )}
                    </td>
                    
                    {/* Column untuk Teacher/Admin: Jumlah Submission */}
                    {userInfo.role !== 'student' && (
                      <td className="p-3">
                        <button
                          onClick={() => router.push(`/submissions?school=${item.school_id}&subject=${item.subject_id}&assignment=${item.id}`)}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2 text-sm"
                        >
                          <Eye size={14} />
                          View Submissions
                        </button>
                      </td>
                    )}
                    
                    {/* Action Column */}
                    <td className="p-3">
                      {userInfo.role === 'student' ? (
                        item.has_submitted ? (
                          <div className="space-y-2">
                            <button
                              onClick={() => handleViewSubmissionDetail(item)}
                              className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center gap-2 text-sm"
                            >
                              <Eye size={14} />
                              View Details
                            </button>
                            {isGraded && (
                              <p className="text-xs text-center text-purple-600">
                                Grade: {item.submission_grade}/100
                              </p>
                            )}
                          </div>
                        ) : item.can_submit ? (
                          <div className="space-y-2">
                            <button
                              onClick={() => router.push(`/submit/${item.id}?school=${item.school_id}&subject=${item.subject_id}`)}
                              className="w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center justify-center gap-2 text-sm"
                            >
                              <Upload size={14} />
                              Submit Now
                            </button>
                            {item.hours_until_deadline && item.hours_until_deadline < 24 && (
                              <p className="text-xs text-yellow-600 text-center">
                                ⏰ Deadline soon!
                              </p>
                            )}
                          </div>
                        ) : item.deadline_passed ? (
                          <div className="text-center">
                            <span className="text-red-600 font-medium text-sm">Closed</span>
                            <p className="text-xs text-gray-500 mt-1">Deadline passed</p>
                          </div>
                        ) : (
                          <div className="text-center">
                            <span className="text-gray-600 font-medium text-sm">Not Available</span>
                            <p className="text-xs text-gray-500 mt-1">Cannot submit</p>
                          </div>
                        )
                      ) : (
                        // Actions for Teacher/Admin
                        <div className="flex gap-2">
                          <button
                            onClick={() => router.push(`/assignments/${item.id}?school=${item.school_id}&subject=${item.subject_id}`)}
                            className="p-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                            title="Edit Assignment"
                          >
                            <Edit size={16} />
                          </button>
                          {(userInfo.role === 'super-admin' || userInfo.role === 'teacher') && (
                            <button
                              onClick={() => handleDelete(item.school_id, item.subject_id, item.id, item.name)}
                              className="p-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
                              title="Delete Assignment"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Footer Statistics */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        {userInfo.role === 'student' ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Assignments</p>
              <p className="text-2xl font-bold text-gray-900">{assignments.length}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Available to Submit</p>
              <p className="text-2xl font-bold text-green-600">
                {assignments.filter(a => a.can_submit).length}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Submitted</p>
              <p className="text-2xl font-bold text-blue-600">
                {assignments.filter(a => a.has_submitted).length}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Closed</p>
              <p className="text-2xl font-bold text-red-600">
                {assignments.filter(a => a.deadline_passed).length}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Assignments</p>
              <p className="text-2xl font-bold text-gray-900">{assignments.length}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600">
                {assignments.filter(a => !a.deadline_passed).length}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Closed</p>
              <p className="text-2xl font-bold text-red-600">
                {assignments.filter(a => a.deadline_passed).length}
              </p>
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-4 text-sm text-gray-600 flex justify-between items-center">
        <div>
          Showing {filteredAssignments.length} of {assignments.length} assignments
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadAssignments}
            className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 flex items-center gap-2"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>

      {/* Popup: Detail Submission untuk Student */}
      {showSubmissionDetail && selectedSubmission && userInfo.role === 'student' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Submission Details</h2>
                  <p className="text-gray-600">
                    {selectedSubmission.assignment_name || "Assignment Submission"}
                  </p>
                </div>
                <button
                  onClick={() => setShowSubmissionDetail(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Grade Section */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Grade</h3>
                {selectedSubmission.grade ? (
                  <div className="bg-gray-50 rounded-lg p-6 text-center">
                    <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full text-3xl font-bold mb-3 ${
                      selectedSubmission.grade >= 80 ? 'bg-green-100 text-green-700 border-4 border-green-200' :
                      selectedSubmission.grade >= 60 ? 'bg-yellow-100 text-yellow-700 border-4 border-yellow-200' :
                      'bg-red-100 text-red-700 border-4 border-red-200'
                    }`}>
                      {selectedSubmission.grade}
                    </div>
                    <p className="text-gray-600 mb-2">out of 100</p>
                    <div className="mt-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        selectedSubmission.grade >= 60 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedSubmission.grade >= 60 ? 'PASS' : 'FAIL'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-6 text-center">
                    <Award className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">Not graded yet</p>
                    <p className="text-sm text-gray-500 mt-1">Waiting for teacher's review</p>
                  </div>
                )}
              </div>

              {/* Feedback Section */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Teacher's Feedback</h3>
                {selectedSubmission.feedback?.feedback ? (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare size={16} className="text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">Feedback:</span>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedSubmission.feedback.feedback}</p>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-6 text-center">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No feedback yet</p>
                    <p className="text-sm text-gray-500 mt-1">Feedback will appear here once provided by teacher</p>
                  </div>
                )}
              </div>

              {/* Submitted Files */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Submitted Files</h3>
                {selectedSubmission.file_urls?.length > 0 ? (
                  <div className="space-y-2">
                    {selectedSubmission.file_urls.map((file: any, index: number) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-3">
                          <FileText className="text-gray-400" size={16} />
                          <div>
                            <p className="text-gray-900 text-sm">{file.original_name}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => downloadFile(file.url, file.original_name)}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2 text-sm"
                        >
                          <Download size={14} />
                          Download
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-gray-600">No files submitted</p>
                  </div>
                )}
              </div>

              {/* Submission Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Submission Date</p>
                  <p className="font-medium">{formatSubmissionDate(selectedSubmission.submitted_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Status</p>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedSubmission.grade 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {selectedSubmission.grade ? 'Graded' : 'Submitted'}
                  </span>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setShowSubmissionDetail(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Popup: Grade Form untuk Teacher/Admin */}
      {showGradeForm && selectedSubmission && (userInfo.role === 'teacher' || userInfo.role === 'super-admin') && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-lg text-gray-900">Grade Submission</h2>
                <button
                  onClick={() => setShowGradeForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Student Info */}
              <div className="mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="text-blue-600" size={18} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{selectedSubmission.user?.name || 'Student'}</p>
                    <p className="text-sm text-gray-500">{selectedSubmission.user?.email || ''}</p>
                  </div>
                </div>
              </div>

              {/* Grade Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Grade (0-100)</label>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={grade} 
                  onChange={(e) => setGrade(+e.target.value)} 
                  className="w-full mb-2" 
                />
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    className="flex-1 border border-gray-300 p-2 rounded text-gray-900" 
                    value={grade} 
                    min={0} 
                    max={100} 
                    onChange={(e) => setGrade(+e.target.value)} 
                  />
                  <span className="text-gray-600">/100</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0 (Fail)</span>
                  <span>60 (Pass)</span>
                  <span>100 (Excellent)</span>
                </div>
              </div>

              {/* Feedback Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Feedback</label>
                <textarea 
                  className="w-full border border-gray-300 p-2 rounded text-gray-900" 
                  rows={4} 
                  value={feedback} 
                  onChange={(e) => setFeedback(e.target.value)} 
                  placeholder="Provide detailed feedback for the student..." 
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowGradeForm(false)} 
                  className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50"
                  disabled={grading}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleGradeSubmit} 
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center justify-center gap-2"
                  disabled={grading}
                >
                  {grading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Star size={16} />
                      Save Grade
                    </>
                  )}
                </button>
              </div>

              {/* Submitted Files Preview */}
              <div className="mt-6 pt-4 border-t">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Submitted Files</h3>
                <div className="space-y-1">
                  {selectedSubmission.file_urls?.slice(0, 3).map((file: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <FileText size={12} className="text-gray-400" />
                      <span className="truncate">{file.original_name}</span>
                    </div>
                  ))}
                  {selectedSubmission.file_urls?.length > 3 && (
                    <p className="text-xs text-gray-500">
                      +{selectedSubmission.file_urls.length - 3} more files
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}