'use client';
import { useState, useEffect } from 'react';
import { Pill } from 'lucide-react';

export default function PharmacyDashboard() {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);

  const fetchPrescriptions = async () => {
    const token = document.cookie.split('token=')[1]?.split(';')[0];
    if(!token) return;
    try {
      const res = await fetch('http://${process.env.NEXT_PUBLIC_API_URL}/api/v1/pharmacy/prescriptions', { 
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if(res.ok) setPrescriptions(await res.json());
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
    }
  };

  useEffect(() => { fetchPrescriptions(); }, []);

  // 👈 الدالة الجديدة المسؤولة عن الصرف أو التبليغ بعدم التوفر (تستدعي مسار /status بدلاً من /dispense)
  const handlePharmacyAction = async (id: number, action: 'dispensed' | 'out_of_stock') => {
    let note = '';
    if (action === 'out_of_stock') {
      note = prompt('اكتب ملاحظة للطبيب (مثال: الدواء غير متوفر، مقترح إعطاء كذا):') || 'غير متوفر';
    }
    
    const token = document.cookie.split('token=')[1]?.split(';')[0];
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${API_URL}/api/v1/pharmacy/prescriptions/${id}/status`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ action, note })
      });
      
      if (res.ok) {
        alert(action === 'dispensed' ? 'تم صرف الدواء بنجاح' : 'تم إرسال الملاحظة للطبيب بنجاح');
        fetchPrescriptions(); // تحديث القائمة لإخفاء الوصفة
      } else {
        alert('حدث خطأ أثناء معالجة الوصفة');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <section className="p-8 max-w-5xl mx-auto space-y-6">
      <h2 className="text-3xl font-bold text-primary">لوحة تحكم الصيدلية</h2>
      
      {prescriptions.length === 0 ? (
        <p className="text-center bg-card p-12 border rounded-xl shadow-sm text-muted-foreground">لا توجد وصفات قيد الانتظار.</p>
      ) : (
        <ul className="space-y-4">
          {prescriptions.map((p: any) => (
            <li key={p.id} className="rounded-xl border p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between bg-card hover:shadow-md transition-shadow">
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <Pill size={24}/>
                </div>
                <div>
                  <span className="font-semibold text-xl block text-foreground">موعد #{p.appointment_id} - المريض: {p.patient_name || 'بدون اسم'}</span>
                  {/* 👈 أضف هذا السطر أسفل الاسم مباشرة */}
                  <span className="text-sm font-bold text-blue-700 block mt-1">العيادة المُحولة: {p.clinic_name}</span>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm bg-amber-100 text-amber-800 px-3 py-1.5 rounded font-bold">الدواء: {p.medication_name}</p>
                    <p className="text-sm bg-gray-100 text-gray-800 px-3 py-1.5 rounded">الجرعة: {p.dosage_instructions}</p>
                  </div>
                </div>
              </div>
              
              {/* 👈 هنا يظهر الزران الجديدان: غير متوفر / تم الصرف */}
              <div className="flex gap-3 mt-5 md:mt-0 w-full md:w-auto">
                <button 
                  onClick={() => handlePharmacyAction(p.id, 'out_of_stock')} 
                  className="bg-red-100 text-red-700 px-5 py-2.5 rounded-lg font-bold hover:bg-red-200 transition-colors flex-1 md:flex-none"
                >
                  غير متوفر
                </button>
                <button 
                  onClick={() => handlePharmacyAction(p.id, 'dispensed')} 
                  className="bg-primary text-white px-6 py-2.5 rounded-lg font-bold hover:bg-primary/90 transition-colors flex-1 md:flex-none shadow-sm"
                >
                  تم الصرف
                </button>
              </div>
              
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}