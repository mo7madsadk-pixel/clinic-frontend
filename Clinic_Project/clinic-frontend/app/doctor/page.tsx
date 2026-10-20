'use client';

import { useState, useEffect, useContext } from 'react';
import { LocaleContext } from '@/providers/locale-provider';
import { User, Activity, CheckCircle, ClipboardList, Beaker, Pill, AlertTriangle } from 'lucide-react';

export default function DoctorDashboard() {
  const { locale } = useContext(LocaleContext);

  // --- 1. State Management ---
  const [queue, setQueue] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [doctorNotes, setDoctorNotes] = useState('');
  const [loading, setLoading] = useState(true);
  
  // حالات السجل الطبي السابق
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [patientHistory, setPatientHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // Modals visibility
  const [showLabModal, setShowLabModal] = useState(false);
  const [showPharmacyModal, setShowPharmacyModal] = useState(false);
  
  // Lab state
  const [labTests, setLabTests] = useState('');
  
  // Pharmacy state (Array of medications)
  const [medications, setMedications] = useState([{ name: '', dosage: '' }]);

  // --- 2. Handlers & Functions ---
  
  const addMedication = () => {
    setMedications([...medications, { name: '', dosage: '' }]);
  };

  const updateMedication = (index: number, field: 'name' | 'dosage', value: string) => {
    const newMeds = [...medications];
    newMeds[index] = { ...newMeds[index], [field]: value };
    setMedications(newMeds);
  };

  const fetchQueue = async () => {
    setLoading(true); 
    const token = document.cookie.split('token=')[1]?.split(';')[0];
    if (!token) {
      setLoading(false);
      return;
    }
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/doctor/appointments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setQueue(await res.json());
      }
    } catch (error) { 
      console.error("Error fetching queue:", error); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    fetchQueue(); 
  }, []);

  const handleExamine = async (action: 'completed' | 'lab' | 'pharmacy') => {
    const appointmentId = selectedPatient?.id || selectedPatient?.patient_id;
    
    if (!appointmentId) {
      alert("خطأ تقني: لا يوجد معرّف صحيح للمريض.");
      return;
    }

    const token = document.cookie.split('token=')[1]?.split(';')[0];
    
    const payload = {
      doctor_notes: doctorNotes,
      action: action,
      lab_tests: action === 'lab' ? labTests : null,
      medications: action === 'pharmacy' ? medications : [] 
    };

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/doctor/appointments/${appointmentId}/examine`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        alert(locale === 'ar' ? 'تمت العملية وتحديث حالة المريض بنجاح' : 'Success');
        
        setSelectedPatient(null);
        setDoctorNotes(''); 
        setLabTests(''); 
        setMedications([{ name: '', dosage: '' }]); 
        setShowLabModal(false); 
        setShowPharmacyModal(false);
        
        fetchQueue();
      } else {
        alert("حدث خطأ أثناء معالجة الطلب.");
      }
    } catch (error) { 
      console.error('Error updating patient status:', error); 
    }
  };

  // تم تصحيح نوع المتغير هنا من int إلى number ليطابق لغة TypeScript
  const fetchPatientHistory = async (patientId: number) => {
    setLoadingHistory(true);
    setShowHistoryModal(true);
    const token = document.cookie.split('token=')[1]?.split(';')[0];
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${API_URL}/api/v1/doctor/patients/${patientId}/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setPatientHistory(await res.json());
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  // --- 3. Render: Examination View ---
  if (selectedPatient) {
    return (
      <div className="p-8 max-w-5xl mx-auto space-y-6 relative">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-4 gap-4">
          <h1 className="text-3xl font-bold text-primary">
            المعاينة السريرية - {selectedPatient.patient?.name || 'بدون اسم'} (ملف #{selectedPatient.patient_id})
          </h1>
          <div className="flex gap-3">
            <button 
              onClick={() => fetchPatientHistory(selectedPatient.patient_id)} 
              className="bg-blue-100 text-blue-700 hover:bg-blue-200 font-bold px-4 py-2 rounded-md transition-colors shadow-sm flex items-center gap-2"
            >
              📜 السجل الطبي السابق
            </button>
            <button 
              onClick={() => setSelectedPatient(null)} 
              className="text-gray-500 hover:text-gray-800 font-semibold px-4 py-2 border rounded-md transition-colors"
            >
              العودة للطابور
            </button>
          </div>
        </div>
        
        {/* Vitals Section */}
        <div className="bg-blue-50/50 border border-blue-100 p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
            <Activity size={20}/> العلامات الحيوية
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-blue-800">
            <div className="bg-white p-3 rounded shadow-sm border border-blue-100">
              <b className="block text-xs mb-1 text-blue-600">ضغط الدم</b> 
              <span className="font-semibold text-lg">{selectedPatient.blood_pressure || 'غير متوفر'}</span>
            </div>
            <div className="bg-white p-3 rounded shadow-sm border border-blue-100">
              <b className="block text-xs mb-1 text-blue-600">الحرارة</b> 
              <span className="font-semibold text-lg">{selectedPatient.temperature || 'غير متوفر'}</span>
            </div>
            <div className="bg-white p-3 rounded shadow-sm border border-blue-100">
              <b className="block text-xs mb-1 text-blue-600">الوزن</b> 
              <span className="font-semibold text-lg">{selectedPatient.weight || 'غير متوفر'}</span>
            </div>
          </div>
          {selectedPatient.nurse_notes && (
            <div className="mt-4 text-sm bg-white p-4 border border-blue-100 rounded-lg shadow-sm">
              <b className="text-blue-700">ملاحظات التمريض: </b> {selectedPatient.nurse_notes}
            </div>
          )}
        </div>

        {/* Lab Results Alert */}
        {selectedPatient.lab_result && (
          <div className="bg-purple-50 p-5 border border-purple-200 rounded-xl shadow-sm">
            <h4 className="font-bold text-purple-900 mb-2 flex items-center gap-2">
              <Beaker size={20}/> نتيجة التحاليل المخبرية:
            </h4>
            <p className="text-purple-800 font-medium whitespace-pre-wrap">{selectedPatient.lab_result}</p>
          </div>
        )}

        {/* Pharmacy Alert */}
        {selectedPatient.pharmacist_note && (
          <div className="bg-red-50 p-5 border border-red-200 rounded-xl shadow-sm">
            <h4 className="font-bold text-red-900 mb-2 flex items-center gap-2">
              <AlertTriangle size={20}/> تنبيه من الصيدلية:
            </h4>
            <p className="text-red-800 font-medium whitespace-pre-wrap">{selectedPatient.pharmacist_note}</p>
          </div>
        )}

        {/* Doctor Notes & Actions */}
        <div className="bg-card border p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <ClipboardList size={20} className="text-primary"/> التشخيص السريري وخطة العلاج
          </h3>
          <textarea 
            value={doctorNotes} 
            onChange={(e) => setDoctorNotes(e.target.value)} 
            rows={5} 
            className="w-full border border-input rounded-md p-4 bg-background outline-none focus:ring-2 focus:ring-primary/40 resize-none" 
            placeholder="اكتب التشخيص والملاحظات الطبية هنا..." 
          />
          
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 mt-6 border-t pt-6">
            <button 
              onClick={() => setShowPharmacyModal(true)} 
              className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-md font-bold flex justify-center items-center gap-2 transition-colors shadow-sm"
            >
              <Pill size={18}/> تحويل للصيدلية
            </button>
            <button 
              onClick={() => setShowLabModal(true)} 
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-md font-bold flex justify-center items-center gap-2 transition-colors shadow-sm"
            >
              <Beaker size={18}/> طلب تحاليل (المختبر)
            </button>
            <div className="flex-1"></div>
            <button 
              onClick={() => handleExamine('completed')} 
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-md font-bold flex justify-center items-center gap-2 transition-colors shadow-sm"
            >
              <CheckCircle size={18}/> إنهاء الزيارة
            </button>
          </div>
        </div>

        {/* Modals */}
        {showLabModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-card p-6 rounded-2xl w-full max-w-lg shadow-2xl border">
              <h3 className="font-bold text-xl mb-4 flex items-center gap-2 text-purple-700 border-b pb-3">
                <Beaker size={24}/> تفاصيل التحاليل المطلوبة
              </h3>
              <label className="block text-sm font-semibold mb-2">أنواع التحاليل (الرجاء الفصل بينها):</label>
              <textarea 
                value={labTests} 
                onChange={e => setLabTests(e.target.value)} 
                className="w-full border border-input p-3 rounded-md mb-6 bg-background outline-none focus:ring-2 focus:ring-purple-400 resize-none" 
                rows={4} 
                placeholder="مثال: صورة دم كاملة CBC، فحص سكر تراكمي..."
              />
              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowLabModal(false)} className="px-5 py-2.5 border rounded-md font-semibold hover:bg-muted transition-colors">إلغاء</button>
                <button onClick={() => handleExamine('lab')} className="px-6 py-2.5 bg-purple-600 text-white rounded-md font-bold hover:bg-purple-700 transition-colors shadow-md">تأكيد الإرسال للمختبر</button>
              </div>
            </div>
          </div>
        )}

        {showPharmacyModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-card p-6 rounded-2xl w-full max-w-2xl shadow-2xl border max-h-[90vh] overflow-y-auto">
              <h3 className="font-bold text-xl mb-4 flex items-center gap-2 text-amber-600 border-b pb-3">
                <Pill size={24}/> كتابة الوصفة الطبية
              </h3>
              
              {medications.map((med, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg border mb-4 relative">
                  <h4 className="text-sm font-bold text-gray-700 mb-3">الدواء رقم {index + 1}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">اسم الدواء:</label>
                      <input 
                        value={med.name} 
                        onChange={(e) => updateMedication(index, 'name', e.target.value)} 
                        className="w-full border p-2 rounded-md bg-white outline-none focus:ring-2 focus:ring-amber-400" 
                        placeholder="مثال: Paracetamol 500mg" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">الجرعة والتعليمات:</label>
                      <input 
                        value={med.dosage} 
                        onChange={(e) => updateMedication(index, 'dosage', e.target.value)} 
                        className="w-full border p-2 rounded-md bg-white outline-none focus:ring-2 focus:ring-amber-400" 
                        placeholder="مثال: حبة كل 8 ساعات" 
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button 
                onClick={addMedication} 
                className="text-amber-600 font-bold text-sm flex items-center gap-1 mb-6 hover:underline"
              >
                + إضافة دواء آخر
              </button>

              <div className="flex gap-3 justify-end border-t pt-4">
                <button onClick={() => setShowPharmacyModal(false)} className="px-5 py-2.5 border rounded-md font-semibold hover:bg-muted">إلغاء</button>
                <button onClick={() => handleExamine('pharmacy')} className="px-6 py-2.5 bg-amber-500 text-white rounded-md font-bold hover:bg-amber-600">إرسال للصيدلية</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal السجل الطبي السابق */}
        {showHistoryModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-card p-6 rounded-2xl w-full max-w-3xl shadow-2xl border max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b pb-3 mb-4">
                <h3 className="font-bold text-xl text-blue-700 flex items-center gap-2">
                  📜 السجل الطبي - المريض: {selectedPatient.patient?.name}
                </h3>
                <button onClick={() => setShowHistoryModal(false)} className="text-gray-500 hover:text-red-500 font-bold text-xl">✕</button>
              </div>
              
              {loadingHistory ? (
                <div className="py-12 text-center text-muted-foreground animate-pulse font-bold">
                  جاري جلب السجلات السابقة...
                </div>
              ) : patientHistory.length === 0 ? (
                <div className="py-12 text-center text-gray-500 bg-gray-50 rounded-lg border">
                  لا توجد زيارات مكتملة سابقة لهذا المريض. هذه هي زيارته الأولى.
                </div>
              ) : (
                <div className="space-y-6">
                  {patientHistory.map((visit, index) => (
                    <div key={index} className="border border-blue-200 rounded-xl overflow-hidden shadow-sm">
                      <div className="bg-blue-50 px-4 py-3 border-b border-blue-200 flex justify-between items-center">
                        <span className="font-bold text-blue-900">العيادة: {visit.clinic_name}</span>
                        <span className="text-sm font-semibold text-blue-700 bg-blue-100 px-3 py-1 rounded-full">{visit.date}</span>
                      </div>
                      <div className="p-4 bg-white space-y-4">
                        <div>
                          <span className="block text-xs font-bold text-gray-500 mb-1">التشخيص السريري المسبق:</span>
                          <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded-md border">{visit.doctor_notes}</p>
                        </div>
                        
                        {visit.lab_result !== "لم يتم طلب تحاليل" && (
                          <div>
                            <span className="block text-xs font-bold text-purple-600 mb-1">نتائج التحاليل المرفقة:</span>
                            <p className="text-sm text-purple-900 bg-purple-50 p-3 rounded-md border border-purple-100">{visit.lab_result}</p>
                          </div>
                        )}
                        
                        {visit.medications.length > 0 && (
                          <div>
                            <span className="block text-xs font-bold text-amber-600 mb-1">الأدوية المصروفة:</span>
                            <ul className="text-sm bg-amber-50 p-3 rounded-md border border-amber-100 space-y-2">
                              {visit.medications.map((med: any, mIdx: number) => (
                                <li key={mIdx} className="flex gap-2 items-center">
                                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                                  <b>{med.name}</b> - {med.dosage}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- 4. Render: Queue View ---
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold text-primary">واجهة الطبيب - طابور العيادة</h1>
        <button 
          onClick={fetchQueue} 
          className="bg-blue-100 text-blue-700 font-bold px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors shadow-sm"
        >
          🔄 تحديث الطابور
        </button>
      </div>
      
      <div className="bg-card p-6 rounded-xl shadow-sm border min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground animate-pulse">
            <p className="text-xl font-semibold">جاري تحميل قائمة المرضى...</p>
          </div>
        ) : queue.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <span className="text-6xl mb-4">🩺</span>
            <p className="text-xl font-medium">لا يوجد مرضى في طابور عيادتك حالياً.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {queue.map((p) => (
              <div key={p.id} className="p-5 border border-border rounded-xl flex flex-col sm:flex-row justify-between items-center bg-background hover:shadow-md transition-all">
                <div className="flex items-center gap-5 mb-4 sm:mb-0 w-full sm:w-auto">
                  <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center shadow-sm">
                    <User size={28}/>
                  </div>
                  <div>
                    <span className="font-bold text-xl block text-foreground">
                      ملف #{p.patient_id} - {p.patient?.name || 'بدون اسم'}
                    </span>
                    <span className="text-md text-blue-700 font-bold block mt-1">
                      العيادة: {p.clinic?.name || 'غير محددة'}
                    </span>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="text-sm font-medium text-muted-foreground">الحالة:</span>
                      {p.status === 'scheduled' && <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-md text-xs font-bold">بانتظار التمريض</span>}
                      {p.status === 'ready_for_doctor' && <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-md text-xs font-bold">بانتظار المعاينة</span>}
                      {p.status === 'lab_results_ready' && <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-md text-xs font-bold animate-pulse">🧪 نتائج المختبر جاهزة</span>}
                      {p.status === 'pharmacy_note' && <span className="bg-red-100 text-red-800 px-3 py-1 rounded-md text-xs font-bold animate-pulse">⚠️ تنبيه من الصيدلية</span>}
                      {p.status === 'with_doctor' && <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-md text-xs font-bold">قيد المعاينة حالياً</span>}
                    </div>
                  </div>
                </div>
                
                {p.status !== 'completed' && p.status !== 'pending_checkout' && (
                  <button 
                    onClick={() => setSelectedPatient(p)} 
                    className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-bold hover:bg-primary/90 transition-colors w-full sm:w-auto shadow-sm"
                  >
                    بدء المعاينة
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}