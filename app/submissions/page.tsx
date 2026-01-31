'use client'

import { useEffect, useState } from 'react'
import { Eye, Star, Search, FileText, User, Award, MessageSquare, RefreshCw, X } from 'lucide-react'
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
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const [selected, setSelected] = useState<any | null>(null)
  const [grade, setGrade] = useState<number>(0)
  const [feedback, setFeedback] = useState<string>('')
  const [viewingFeedback, setViewingFeedback] = useState<any | null>(null)

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
    assignmentService.getBySubject(schoolId, subjectId).then(setAssignments)
    setSubmissions([])
    setAssignmentId(null)
  }, [subjectId])

  useEffect(() => {
    if (!schoolId || !subjectId || !assignmentId) return
    loadSubmissions()
  }, [assignmentId])

  const loadSubmissions = async () => {
    setLoading(true)
    try {
      const data = await submissionService.getByAssignment(schoolId!, subjectId!, assignmentId!)
      setSubmissions(data)
    } catch (error) {
      console.error('Error loading submissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredSubmissions = submissions.filter(s => {
    const matchesSearch = s.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toString().includes(searchQuery)
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'submitted' && !s.grade) ||
      (statusFilter === 'graded' && s.grade)
    
    return matchesSearch && matchesStatus
  })

  const pendingCount = submissions.filter(s => !s.grade).length
  const gradedCount = submissions.filter(s => s.grade).length

  const submitGrade = async () => {
    if (!selected) return

    await submissionService.grade(schoolId!, subjectId!, assignmentId!, selected.id, { grade })

    if (feedback.trim() !== '') {
      await submissionService.saveFeedback(schoolId!, subjectId!, assignmentId!, selected.id, { feedback })
    }

    alert('Nilai & feedback berhasil disimpan')
    setSelected(null)
    setFeedback('')
    loadSubmissions()
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Submission Siswa</h1>
          <p className="text-gray-600 mt-1">Kelola dan nilai submission siswa</p>
        </div>

        <div className="bg-white rounded-lg border p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 text-gray-500">
            <select className="w-full px-3 py-2 border rounded" value={schoolId ?? ''} onChange={(e) => setSchoolId(e.target.value ? +e.target.value : null)}>
              <option value="">Pilih Sekolah</option>
              {schools.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
            </select>
            <select className="w-full px-3 py-2 border rounded disabled:bg-gray-100" value={subjectId ?? ''} disabled={!schoolId} onChange={(e) => setSubjectId(e.target.value ? +e.target.value : null)}>
              <option value="">Pilih Subject</option>
              {subjects.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
            </select>
            <select className="w-full px-3 py-2 border rounded disabled:bg-gray-100" value={assignmentId ?? ''} disabled={!subjectId} onChange={(e) => setAssignmentId(e.target.value ? +e.target.value : null)}>
              <option value="">Pilih Assignment</option>
              {assignments.map((a) => (<option key={a.id} value={a.id}>{a.name}</option>))}
            </select>
            <select className="w-full px-3 py-2 border rounded" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">Semua Status</option>
              <option value="submitted">Belum Dinilai</option>
              <option value="graded">Sudah Dinilai</option>
            </select>
          </div>
          <div className="flex gap-4 text-gray-500">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
              <input type="text" placeholder="Cari siswa..." className="w-full pl-10 pr-4 py-2 border rounded" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <button onClick={loadSubmissions} disabled={loading || !assignmentId} className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </div>

        {assignmentId && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div><p className="text-sm text-gray-600">Total Submissions</p><p className="text-xl font-bold text-gray-900">{submissions.length}</p></div>
                <FileText className="text-blue-500" size={24} />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div><p className="text-sm text-gray-600">Belum Dinilai</p><p className="text-xl font-bold text-gray-900">{pendingCount}</p></div>
                <Award className="text-yellow-500" size={24} />
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg border overflow-hidden">
          {loading ? (<div className="p-8 text-center"><RefreshCw className="w-6 h-6 animate-spin mx-auto text-gray-400 mb-2" /><p className="text-gray-500">Memuat data...</p></div>) : !assignmentId ? (<div className="p-8 text-center text-gray-500">Pilih sekolah, subject, dan assignment terlebih dahulu</div>) : filteredSubmissions.length === 0 ? (<div className="p-8 text-center text-gray-500">{searchQuery || statusFilter !== 'all' ? 'Tidak ditemukan' : 'Belum ada submission'}</div>) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50"><tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Siswa</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">File</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Nilai</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Feedback</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Aksi</th>
                  </tr></thead>
                <tbody className="divide-y">
                  {filteredSubmissions.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center"><User size={14} className="text-blue-600" /></div>
                          <div><p className="font-medium text-gray-900">{s.user?.name || `User #${s.user_id}`}</p><p className="text-sm text-gray-500">{new Date(s.submitted_at).toLocaleDateString('id-ID')}</p></div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          {s.file_urls?.map((f: any, i: number) => (
                            <a key={i} href={f.url} target="_blank" className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm">
                              <FileText size={12} /><span className="max-w-[150px] truncate">{f.original_name}</span>
                            </a>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs ${s.grade ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>{s.grade ? 'Graded' : 'Submitted'}</span></td>
                      <td className="px-4 py-3">{s.grade ? (<span className={`px-3 py-1 rounded ${s.grade >= 60 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{s.grade}/100</span>) : (<span className="text-gray-400">-</span>)}</td>
                      <td className="px-4 py-3">
                        {s.feedback?.feedback ? (
                          <div><div onClick={() => setViewingFeedback(s)} className="cursor-pointer hover:bg-gray-100 p-2 rounded">
                              <div className="flex items-start gap-2"><MessageSquare size={14} className="text-gray-400 mt-0.5 flex-shrink-0" /><p className="text-sm text-gray-700 line-clamp-2 truncate w-30">{s.feedback.feedback}</p></div>
                              <div className="text-xs text-gray-500 mt-1 text-right">Lihat selengkapnya →</div></div></div>
                        ) : (<span className="text-sm text-gray-400 italic">Belum ada feedback</span>)}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => { setSelected(s); setGrade(s.grade ?? 0); setFeedback(s.feedback?.feedback ?? '') }} className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2 text-sm">
                          <Eye size={14} />{s.grade ? 'Edit Nilai' : 'Beri Nilai'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg text-gray-900">Nilai untuk {selected.user?.name}</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Nilai (0-100)</label>
              <input type="range" min="0" max="100" value={grade} onChange={(e) => setGrade(+e.target.value)} className="w-full mb-2" />
              <input type="number" className="w-full border border-gray-300 p-2 rounded text-gray-900" value={grade} min={0} max={100} onChange={(e) => setGrade(+e.target.value)} />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Feedback</label>
              <textarea className="w-full border border-gray-300 p-2 rounded text-gray-900" rows={4} value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Berikan feedback untuk siswa..." />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setSelected(null)} className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50">Batal</button>
              <button onClick={submitGrade} className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center justify-center gap-2"><Star size={16} />Simpan Nilai</button>
            </div>
          </div>
        </div>
      )}

      {viewingFeedback && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-lg">
            <div className="flex justify-between items-center mb-6">
              <div><h2 className="font-bold text-lg text-gray-900">Feedback</h2><p className="text-sm text-gray-600">Untuk {viewingFeedback.user?.name}</p></div>
              <button onClick={() => setViewingFeedback(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center"><User size={18} className="text-blue-600" /></div>
                <div><p className="font-medium text-gray-900">{viewingFeedback.user?.name}</p><p className="text-sm text-gray-500">Submission #{viewingFeedback.id} • {new Date(viewingFeedback.submitted_at).toLocaleDateString('id-ID')}</p></div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2"><MessageSquare size={16} className="text-gray-400" /><span className="text-sm font-medium text-gray-700">Feedback:</span></div>
                <p className="text-gray-900 whitespace-pre-wrap">{viewingFeedback.feedback?.feedback || 'Belum ada feedback'}</p>
              </div>
            </div>
            <div className="flex justify-end"><button onClick={() => setViewingFeedback(null)} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">Tutup</button></div>
          </div>
        </div>
      )}
    </div>
  )
}