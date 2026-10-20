'use client';

import { useState, useContext, useEffect, useCallback } from 'react';
import { LocaleContext } from '@/providers/locale-provider';
import { CheckCircle, Search, UserPlus, Loader2 } from 'lucide-react';

// OPTIMIZATION: Extract the base API URL to a constant to avoid hardcoding it multiple times.
// In a real production environment, use process.env.NEXT_PUBLIC_API_URL.
const API_URL = process.env.NEXT_PUBLIC_API_URL;

// OPTIMIZATION: Create a helper function to reliably extract the token and keep the code DRY.
const getAuthToken = () => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )token=([^;]+)'));
  return match ? match[2] : null;
};

export default function ReceptionistDashboard() {
  const { locale } = useContext(LocaleContext);
  const [clinicsList, setClinicsList] = useState<any[]>([]);
  const [queue, setQueue] = useState<any[]>([]);
  const [completedVisits, setCompletedVisits] = useState<any[]>([]);

  const [isNewPatient, setIsNewPatient] = useState(true);
  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedExistingPatient, setSelectedExistingPatient] = useState<any>(null);

  const [selectedClinic, setSelectedClinic] = useState<number>(1);
  const [sessionType, setSessionType] = useState('استشارة أولية');

  // RESILIENCE: Added a loading state to prevent multiple rapid form submissions (double-booking).
  const [isSubmitting, setIsSubmitting] = useState(false);

  // OPTIMIZATION: Wrapped in useCallback to prevent unnecessary re-creations on every render.
  const fetchAppointments = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;
    
    // RESILIENCE: Added try/catch block to prevent app crash if the backend is down.
    try {
      const res = await fetch(`${API_URL}/api/v1/receptionist/appointments`, {
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      
      if (!res.ok) throw new Error('Failed to fetch appointments');
      
      const data = await res.json();
      setQueue(data.filter((item: any) => item.status !== 'completed'));
      setCompletedVisits(data.filter((item: any) => item.status === 'completed'));
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  }, []);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;

    // RESILIENCE: Added try/catch for the initial clinics fetch.
    const fetchClinics = async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/receptionist/clinics`, {
          headers: { 'Authorization': `Bearer ${token}` } 
        });
        if (res.ok) {
          const data = await res.json();
          setClinicsList(data);
          if (data.length > 0) setSelectedClinic(data[0].id);
        }
      } catch (error) {
        console.error('Error fetching clinics:', error);
      }
    };

    fetchClinics();
    fetchAppointments();
  }, [fetchAppointments]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    const token = getAuthToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/v1/patients/search?query=${encodeURIComponent(searchQuery)}`, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (res.ok) {
        setSearchResults(await res.json());
      }
    } catch (error) {
      console.error('Error searching patients:', error);
    }
  };

  const handleAddAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAuthToken();
    if (!token) return;

    setIsSubmitting(true);
    let patientId = selectedExistingPatient?.id;

    try {
      if (isNewPatient) {
        const pRes = await fetch(`${API_URL}/api/v1/patients`, {
          method: 'POST', 
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ name: patientName.trim(), age: Number(age) }),
        });
        
        if (!pRes.ok) throw new Error('Failed to create patient');
        const newP = await pRes.json();
        patientId = newP.id;
      }

      if (!patientId) { 
        alert(locale === 'ar' ? 'الرجاء تحديد أو إنشاء مريض' : 'Please select or create a patient');
        setIsSubmitting(false);
        return; 
      }

      const payload = {
        patient_id: patientId,
        clinic_id: Number(selectedClinic), 
        session_type: sessionType,
        scheduled_at: new Date().toISOString()
      };

      const res = await fetch(`${API_URL}/api/v1/receptionist/appointments`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to create appointment');

      await fetchAppointments();
      
      // Reset form states
      setPatientName(''); setAge(''); setSearchQuery(''); 
      setSearchResults([]); setSelectedExistingPatient(null);
      alert(locale === 'ar' ? 'تمت إضافة المراجع وتوجيهه للعيادة!' : 'Patient added and routed to clinic!');
      
    } catch (error) {
      console.error('Error adding appointment:', error);
      alert(locale === 'ar' ? 'حدث خطأ أثناء الإضافة. يرجى المحاولة لاحقاً.' : 'Error adding appointment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-primary border-b pb-4">
        {locale === 'ar' ? 'واجهة الاستقبال - نظام العيادات والمستوصف' : 'Receptionist Dashboard'}
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Registration or Search Window */}
        <div className="bg-card p-6 rounded-xl shadow-sm border h-fit">
          <div className="flex gap-4 mb-6">
            <button type="button" onClick={() => setIsNewPatient(true)} className={`flex-1 py-2 font-bold rounded-md transition-colors ${isNewPatient ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
              {locale === 'ar' ? 'مريض جديد' : 'New Patient'}
            </button>
            <button type="button" onClick={() => setIsNewPatient(false)} className={`flex-1 py-2 font-bold rounded-md transition-colors ${!isNewPatient ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
              {locale === 'ar' ? 'مريض مراجع (سابق)' : 'Returning Patient'}
            </button>
          </div>

          <form onSubmit={handleAddAppointment} className="space-y-5">
            {isNewPatient ? (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">{locale === 'ar' ? 'اسم المراجع' : 'Patient Name'}</label>
                  <input type="text" required value={patientName} onChange={(e) => setPatientName(e.target.value)} className="w-full border p-2.5 rounded-md outline-none focus:ring-2 focus:ring-primary/20" placeholder={locale === 'ar' ? 'أدخل الاسم الثلاثي...' : 'Full Name...'} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{locale === 'ar' ? 'العمر' : 'Age'}</label>
                  <input type="number" min="1" max="120" required value={age} onChange={(e) => setAge(e.target.value)} className="w-full border p-2.5 rounded-md outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </>
            ) : (
              <div className="p-4 border rounded-lg bg-blue-50/30">
                <label className="block text-sm font-medium mb-1">{locale === 'ar' ? 'البحث برقم الملف أو الاسم' : 'Search by ID or Name'}</label>
                <div className="flex gap-2">
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full border p-2.5 rounded-md bg-white outline-none focus:ring-2 focus:ring-primary/20" placeholder={locale === 'ar' ? 'بحث...' : 'Search...'} />
                  <button type="button" onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-md transition-colors"><Search size={20}/></button>
                </div>
                {searchResults.length > 0 && (
                  <ul className="mt-3 border rounded-md bg-white divide-y max-h-40 overflow-y-auto">
                    {searchResults.map(p => (
                      <li key={p.id} onClick={() => setSelectedExistingPatient(p)} className={`p-3 cursor-pointer hover:bg-blue-50 transition-colors ${selectedExistingPatient?.id === p.id ? 'bg-blue-100 font-bold border-l-4 border-blue-600' : ''}`}>
                        ملف #{p.id} - {p.name} (العمر: {p.age})
                      </li>
                    ))}
                  </ul>
                )}
                {selectedExistingPatient && <div className="mt-3 text-green-700 font-bold flex gap-2 items-center"><CheckCircle size={18}/> تم اختيار المريض: {selectedExistingPatient.name}</div>}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">{locale === 'ar' ? 'العيادة الوجهة' : 'Clinic'}</label>
                <select value={selectedClinic} onChange={(e) => setSelectedClinic(Number(e.target.value))} className="w-full border p-2.5 rounded-md outline-none focus:ring-2 focus:ring-primary/20">
                  {clinicsList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{locale === 'ar' ? 'نوع الجلسة' : 'Session Type'}</label>
                <select value={sessionType} onChange={(e) => setSessionType(e.target.value)} className="w-full border p-2.5 rounded-md outline-none focus:ring-2 focus:ring-primary/20">
                  <option value="استشارة أولية">استشارة أولية</option>
                  <option value="جلسة متابعة">جلسة متابعة</option>
                </select>
              </div>
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full bg-primary text-white py-3 rounded-md hover:bg-primary/90 font-bold text-lg mt-4 shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
              {isSubmitting && <Loader2 className="animate-spin" size={20} />}
              {locale === 'ar' ? 'فتح ملف وإضافة للطابور' : 'Create File & Add to Queue'}
            </button>
          </form>
        </div>

        <div className="space-y-8">
          {/* Active Queue */}
          <div className="bg-card p-6 rounded-xl shadow-sm border">
            <h2 className="text-xl font-semibold mb-4 flex justify-between items-center">
              {locale === 'ar' ? 'قائمة المراجعين المنتظرين' : 'Active Queue'} <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold">{queue.length}</span>
            </h2>
            {queue.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-8 text-muted-foreground"><span className="text-4xl mb-3">📭</span><p>{locale === 'ar' ? 'لا يوجد مراجعين في الانتظار حالياً.' : 'Queue is empty.'}</p></div>
            ) : (
              <ul className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                {queue.map((p, idx) => (
                  <li key={p.id || idx} className="p-4 border rounded-lg flex justify-between items-center bg-background shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">{p.patient_id}</div>
                      <div>
                        <span className="font-bold block text-foreground">
                         ملف #{p.patient_id} - {p.patient?.name || (locale === 'ar' ? 'بدون اسم' : 'Unnamed')}
                         </span>
                        <span className="text-xs text-primary font-bold block mt-1">العيادة: {p.clinic?.name || 'غير محددة'}</span>
                        <span className="text-xs text-primary font-medium block mt-0.5">{p.clinicName}</span>
                        <span className="text-xs text-muted-foreground">{p.session_type} | الحالة: {p.status}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Completed Visits */}
          <div className="bg-green-50/50 p-6 rounded-xl shadow-sm border border-green-200">
            <h2 className="text-xl font-semibold mb-4 flex justify-between items-center text-green-900">
              {locale === 'ar' ? 'الزيارات المكتملة (اليوم)' : 'Completed Visits (Today)'} <span className="bg-green-200 text-green-800 px-3 py-1 rounded-full text-sm font-bold">{completedVisits.length}</span>
            </h2>
            {completedVisits.length === 0 ? (
               <p className="text-center text-green-700/60 py-4 text-sm font-medium">{locale === 'ar' ? 'لم يتم إكمال أي زيارة بعد.' : 'No completed visits yet.'}</p>
            ) : (
              <ul className="space-y-3 max-h-[200px] overflow-y-auto pr-2">
                {completedVisits.map((p, idx) => (
                  <li key={p.id || idx} className="p-3 border border-green-200 rounded-lg flex justify-between items-center bg-white shadow-sm">
                    <div>
                      <span className="font-bold block text-green-800">
                        ملف #{p.patient_id} - {p.patient?.name || (locale === 'ar' ? 'بدون اسم' : 'Unnamed')}
                      </span>
                      <span className="text-xs text-green-600 font-medium">{locale === 'ar' ? 'اكتملت المعالجة وانتهت الدورة' : 'Workflow Completed'}</span>
                    </div>
                    <CheckCircle className="text-green-500" size={20}/>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}