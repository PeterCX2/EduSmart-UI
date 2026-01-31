'use client'

import { useEffect, useState } from 'react'
import { Eye, Star } from 'lucide-react'

import { schoolService } from '@/lib/api/schoolService'
import { subjectService } from '@/lib/api/subject'
import { assignmentService } from '@/lib/api/assignment'
import { submissionService } from '@/lib/api/submission'

export default function AdminSubmissionPage() {
  const [schools, setSchools] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  const [submissions, setSubmissions] = useState<any[]>([])

  const [schoolId, setSchoolId] = useState<number | null>(null)
  const [subjectId, setSubjectId] = useState<number | null>(null)
  const [assignmentId, setAssignmentId] = useState<number | null>(null)

  const [loading, setLoading] = useState(false)

  /* ===== MODAL GRADING ===== */
  const [selected, setSelected] = useState<any | null>(null)
  const [grade, setGrade] = useState<number>(0)

  /* ================= LOAD DATA ================= */

  useEffect(() => {
    schoolService.getAll().then(setSchools)
  }, [])

  useEffect(() => {
    if (!schoolId) return

    subjectService.getBySchool(schoolId).then(setSubjects)

    setAssignments([])
    setSubmissions([])
    setSubjectId(null)
    setAssignmentId(null)
  }, [schoolId])

  useEffect(() => {
    if (!schoolId || !subjectId) return

    assignmentService
      .getBySubject(schoolId, subjectId)
      .then(setAssignments)

    setSubmissions([])
    setAssignmentId(null)
  }, [subjectId])

  useEffect(() => {
    if (!schoolId || !subjectId || !assignmentId) return
    loadSubmissions()
  }, [assignmentId])

  const loadSubmissions = async () => {
    setLoading(true)
    const data = await submissionService.getByAssignment(
      schoolId!,
      subjectId!,
      assignmentId!
    )
    setSubmissions(data)
    setLoading(false)
  }

  /* ================= GRADING ================= */

  const submitGrade = async () => {
    if (!selected) return

    await submissionService.grade(
      schoolId!,
      subjectId!,
      assignmentId!,
      selected.id,
      { grade }
    )

    alert('Nilai berhasil disimpan')
    setSelected(null)
    loadSubmissions()
  }

  /* ================= UI ================= */

  return (
    <div className="p-6 bg-white rounded-xl shadow text-gray-700">
      <h1 className="text-2xl font-bold mb-6">
        Admin – Submission Siswa
      </h1>

      {/* FILTER */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <select
          className="border p-2 rounded"
          value={schoolId ?? ''}
          onChange={(e) =>
            setSchoolId(e.target.value ? +e.target.value : null)
          }
        >
          <option value="">Pilih School</option>
          {schools.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <select
          className="border p-2 rounded"
          value={subjectId ?? ''}
          disabled={!schoolId}
          onChange={(e) =>
            setSubjectId(e.target.value ? +e.target.value : null)
          }
        >
          <option value="">Pilih Subject</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <select
          className="border p-2 rounded"
          value={assignmentId ?? ''}
          disabled={!subjectId}
          onChange={(e) =>
            setAssignmentId(e.target.value ? +e.target.value : null)
          }
        >
          <option value="">Pilih Assignment</option>
          {assignments.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">ID</th>
              <th className="p-2 border">Siswa</th>
              <th className="p-2 border">File</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Grade</th>
              <th className="p-2 border">Aksi</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="p-4 text-center">
                  Loading...
                </td>
              </tr>
            )}

            {!loading && submissions.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-center">
                  Belum ada submission
                </td>
              </tr>
            )}

            {submissions.map((s) => (
              <tr key={s.id}>
                <td className="p-2 border">{s.id}</td>
                <td className="p-2 border">
                  {s.user?.name ?? `User #${s.user_id}`}
                </td>
                <td className="p-2 border">
                  {s.file_urls?.map((f: any, i: number) => (
                    <a
                      key={i}
                      href={f.url}
                      target="_blank"
                      className="block text-blue-600 underline"
                    >
                      {f.original_name}
                    </a>
                  ))}
                </td>
                <td className="p-2 border">{s.status}</td>
                <td className="p-2 border">
                  {s.grade ?? '-'}
                </td>
                <td className="p-2 border">
                  <button
                    onClick={() => {
                      setSelected(s)
                      setGrade(s.grade ?? 0)
                    }}
                    className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded"
                  >
                    <Eye size={16} />
                    Nilai
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL GRADING */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-[400px]">
            <h2 className="font-bold text-lg mb-4">
              Nilai Submission #{selected.id}
            </h2>

            <input
              type="number"
              min={0}
              max={100}
              className="border p-2 w-full mb-4"
              value={grade}
              onChange={(e) => setGrade(+e.target.value)}
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setSelected(null)}
                className="border px-4 py-2 rounded"
              >
                Batal
              </button>
              <button
                onClick={submitGrade}
                className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2"
              >
                <Star size={16} />
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
