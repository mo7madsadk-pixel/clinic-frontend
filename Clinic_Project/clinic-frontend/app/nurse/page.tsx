'use client';

import { useState, useEffect, useContext } from 'react';
import { LocaleContext } from '@/providers/locale-provider';
import { UserCheck, Activity, Send } from 'lucide-react';

export default function NurseDashboard() {
  const { locale } = useContext(LocaleContext);
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [vitals, setVitals] = useState({ blood_pressure: '', temperature: '', weight: '', nurse_notes: '' });
  const [loading, setLoading] = useState(false);

  const fetchNurseQueue = async () => {
    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
      if (!token) return;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/nurse/queue`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setPatients(await res.json());
    } catch (error) { 
      console.error('Error fetching nurse queue:', error); 
    }
  };

  useEffect(() => { fetchNurseQueue(); }, []);

  const handleSaveVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    const appointmentId = selectedPatient?.id || selectedPatient?.patient_id;
    
    if (!appointmentId) {
      alert("خطأ تقني: لا يوجد معرّف للمريض، يرجى تحديث الصفحة.");
      return;
    }

    setLoading(true);
    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${API_URL}/api/v1/nurse/patients/${appointmentId}/vitals`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(vitals)
      });
      
      if (!res.ok) throw new Error('Failed to save vitals');
      
      alert(locale === 'ar' ? 'تم حفظ العلامات الحيوية وتحويل الحالة للطبيب بنجاح!' : 'Vitals saved successfully!');
      
      setSelectedPatient(null);
      setVitals({ blood_pressure: '', temperature: '', weight: '', nurse_notes: '' });
      fetchNurseQueue();
    } catch (error) { 
      alert(locale === 'ar' ? 'حدث خطأ أثناء الاتصال بالخادم' : 'Server Error'); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-primary border-b pb-4">
        {locale === 'ar' ? 'لوحة تحكم التمريض - الفحص الأولي' : 'Nurse Dashboard'}
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* قائمة المرضى */}
        <div className="bg-card p-6 rounded-xl shadow-sm border h-fit">
          <h2 className="text-xl font-semibold mb-6 border-b pb-2 flex items-center gap-2">
            <UserCheck className="text-primary" />
            {locale === 'ar' ? 'قائمة المرضى المنتظرين للفحص' : 'Waiting Patients'}
          </h2>
          
          {patients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <span className="text-4xl mb-3">🩺</span>
              <p>{locale === 'ar' ? 'لا توجد مواعيد أو حالات جديدة حالياً.' : 'No new patients.'}</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {patients.map((p: any, idx: number) => (
                <li key={idx} className="p-4 border rounded-lg flex justify-between items-center bg-background shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                      {p.patient_id || idx + 1}
                    </div>
                    <div>
                      {/* 👈 التعديل هنا: إظهار الاسم بجانب رقم الملف */}
                      <span className="font-semibold text-lg block">
                        ملف #{p.patient_id} - {p.patient?.name || (locale === 'ar' ? 'بدون اسم' : 'Unnamed')}
                      </span>
                      {/* 👈 السطر الجديد */}
                      <span className="text-sm text-blue-600 font-bold block mb-1">العيادة: {p.clinic?.name || 'غير محددة'}</span>
                      <span className="text-xs text-muted-foreground">موعد مجدول | جاهز للفحص</span>
                    </div>
                  </div>
                  <button onClick={() => setSelectedPatient(p)} className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-semibold hover:bg-primary/90">
                    إدخال العلامات
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* نموذج إدخال العلامات */}
        <div className="bg-card p-6 rounded-xl shadow-sm border h-fit">
          <h2 className="text-xl font-semibold mb-6 border-b pb-2 flex items-center gap-2">
            <Activity className="text-primary" />
            {locale === 'ar' ? 'تسجيل العلامات الحيوية للمريض' : 'Record Vitals'}
          </h2>
          
          {selectedPatient ? (
            <form onSubmit={handleSaveVitals} className="space-y-5">
              <div className="bg-blue-50/50 border border-blue-100 p-3 rounded-lg text-sm mb-4 text-blue-900 font-bold">
                {/* 👈 التعديل هنا: إظهار الاسم في مربع الإدخال */}
                مريض قيد الفحص: ملف #{selectedPatient.patient_id} - {selectedPatient.patient?.name || 'بدون اسم'}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">ضغط الدم (Blood Pressure)</label>
                <input type="text" required placeholder="مثال: 120/80" value={vitals.blood_pressure} onChange={(e) => setVitals({...vitals, blood_pressure: e.target.value})} className="w-full border rounded-md p-2.5 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">درجة الحرارة (Temperature)</label>
                <input type="text" required placeholder="مثال: 37.5" value={vitals.temperature} onChange={(e) => setVitals({...vitals, temperature: e.target.value})} className="w-full border rounded-md p-2.5 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">الوزن (Weight)</label>
                <input type="text" required placeholder="مثال: 70" value={vitals.weight} onChange={(e) => setVitals({...vitals, weight: e.target.value})} className="w-full border rounded-md p-2.5 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">ملاحظات التمريض</label>
                <textarea value={vitals.nurse_notes} onChange={(e) => setVitals({...vitals, nurse_notes: e.target.value})} className="w-full border rounded-md p-2.5 outline-none resize-none" rows={3} placeholder="أي ملاحظات إضافية..." />
              </div>
              
              <button type="submit" disabled={loading} className="w-full bg-primary text-white py-3 rounded-md font-semibold hover:bg-primary/90 flex justify-center gap-2 mt-4 disabled:opacity-50">
                <Send size={18} /> {loading ? 'جاري الحفظ...' : 'حفظ وتحويل للطبيب'}
              </button>
            </form>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <span className="text-4xl mb-3">📋</span>
              <p>الرجاء اختيار مريض من القائمة لإدخال بياناته.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}