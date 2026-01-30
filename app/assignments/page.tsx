"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { schoolService } from "@/lib/api/schoolService";
import { subjectService } from "@/lib/api/subject";
import { assignmentService } from "@/lib/api/assignment";
import {
  Edit,
  Trash2,
  Plus,
  RefreshCw,
  Search,
  Calendar,
  FileText,
} from "lucide-react";

export default function AssignmentsPage() {
  const router = useRouter();
  
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debug, setDebug] = useState("");

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
  try {
    setLoading(true);
    setAssignments([]);

    const schools = await schoolService.getAll();
    if (!Array.isArray(schools) || schools.length === 0) return;

    const allAssignments: any[] = [];

    for (const school of schools) {
      const subjects = await subjectService.getBySchool(school.id);
      if (!Array.isArray(subjects)) continue;

      for (const subject of subjects) {
        const assignmentsData = await assignmentService.getBySubject(
          school.id,
          subject.id
        );

        if (!Array.isArray(assignmentsData)) continue;

        assignmentsData.forEach((assignment: any) => {
          allAssignments.push({
            ...assignment,
            school_id: school.id,
            school_name: school.name,
            subject_id: subject.id,
            subject_name: subject.name,
          });
        });
      }
    }

    setAssignments(allAssignments);
    setDebug(`Loaded ${allAssignments.length} assignments`);
  } catch (err: any) {
    console.error("LOAD ERROR:", err);
    setDebug("Error loading assignments");
  } finally {
    setLoading(false);
  }
};


  const handleDelete = async (schoolId: number, subjectId: number, assignmentId: number, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    
    try {
      await assignmentService.delete(schoolId, subjectId, assignmentId);
      alert("Deleted!");
      loadAssignments();
    } catch (err) {
      alert("Failed to delete");
    }
  };

  // Filter
  const filteredAssignments = assignments.filter(item => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.name?.toLowerCase().includes(query) ||
      item.subject_name?.toLowerCase().includes(query) ||
      item.school_name?.toLowerCase().includes(query)
    );
  });

  // Format date
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      return new Date(dateStr).toLocaleDateString('id-ID');
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-10">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
          <p className="text-gray-600 mt-2">Loading...</p>
          <p className="text-sm text-gray-500">{debug}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
          <p className="text-gray-600">{debug}</p>
        </div>
        <button
          onClick={() => router.push("/assignments/new")}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={18} />
          New Assignment
        </button>
      </div>

      {/* Search */}
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

      {/* Table */}
      {filteredAssignments.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <FileText size={32} className="mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600 mb-4">
            {assignments.length === 0 ? "No assignments found" : "No search results"}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={loadAssignments}
              className="px-4 py-2 border rounded-lg flex items-center gap-2"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
            <button
              onClick={() => {
                // Test API langsung
                const token = localStorage.getItem('token');
                console.log('Testing API...');
                fetch('http://edusmart.test/api/school/1/subject/1/assignment', {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                  }
                })
                .then(r => r.json())
                .then(data => {
                  console.log('API Response:', data);
                  alert(`Check console. Data structure: ${JSON.stringify(data).substring(0, 100)}...`);
                });
              }}
              className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg"
            >
              Test API
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-left">
                <th className="p-3 text-gray-600">ID</th>
                <th className="p-3 text-gray-600">Name</th>
                <th className="p-3 text-gray-600">Subject</th>
                <th className="p-3 text-gray-600">School</th>
                <th className="p-3 text-gray-600">Deadline</th>
                <th className="p-3 text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-600">
              {filteredAssignments.map((item) => (
                <tr key={item.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">{item.id}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                        <FileText size={16} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{item.name}</p>
                        {item.description && (
                          <p className="text-sm text-gray-500">{item.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <p className="font-medium">{item.subject_name}</p>
                    <p className="text-sm text-gray-500">ID: {item.subject_id}</p>
                  </td>
                  <td className="p-3">
                    <p className="font-medium">{item.school_name}</p>
                    <p className="text-sm text-gray-500">ID: {item.school_id}</p>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-gray-500" />
                      <span>{formatDate(item.deadline)}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/assignments/${item.id}?school=${item.school_id}&subject=${item.subject_id}`)}
                        className="p-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.school_id, item.subject_id, item.id, item.name)}
                        className="p-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Info */}
      <div className="mt-4 text-sm text-gray-600">
        Showing {filteredAssignments.length} of {assignments.length} assignments
        <button
          onClick={loadAssignments}
          className="ml-4 px-3 py-1 bg-gray-100 rounded"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}