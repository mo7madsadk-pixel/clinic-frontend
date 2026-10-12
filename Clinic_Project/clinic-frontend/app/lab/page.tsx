'use client';
import { useState, useEffect } from 'react';
import { TestTubes, CheckCircle } from 'lucide-react';

export default function LabDashboard() {
  const [requests, setRequests] = useState<any[]>([]);
  
  // NEW STATES: For handling the custom modal instead of the browser prompt
  const [showModal, setShowModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [labResultText, setLabResultText] = useState('');

  const fetchRequests = async () => {
    const token = document.cookie.split('token=')[1]?.split(';')[0];
    if(!token) return;
    try {
      const res = await fetch('http://localhost:8000/api/v1/lab/requests', { 
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if(res.ok) setRequests(await res.json());
    } catch (error) {
      console.error('Error fetching lab requests:', error);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  // NEW FUNCTION: Submits the text from the modal textarea to the backend
  const confirmSubmitResult = async () => {
    if (!selectedRequestId || !labResultText.trim()) {
      alert("الرجاء كتابة نتيجة التحليل أولاً.");
      return;
    }
    
    const token = document.cookie.split('token=')[1]?.split(';')[0];
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${API_URL}/api/v1/lab/requests/${selectedRequestId}/status`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ result: labResultText }) // Sending the multi-line text
      });
      
      if (res.ok) {
        alert('تم إرسال النتيجة للطبيب بنجاح');
        setShowModal(false); // Close the modal upon success
        fetchRequests(); // Refresh the list
      } else {
        alert('حدث خطأ أثناء إرسال النتيجة');
      }
    } catch (error) {
      console.error('Error submitting result:', error);
    }
  };

  return (
    <section className="p-8 max-w-5xl mx-auto space-y-6 relative">
      <h2 className="text-3xl font-bold text-primary">لوحة تحكم المخبر</h2>
      
      {requests.length === 0 ? (
        <p className="text-center bg-card p-12 border rounded-xl">لا توجد تحاليل قيد الانتظار.</p>
      ) : (
        <ul className="space-y-4">
          {requests.map((r: any) => (
            <li key={r.id} className="rounded-xl border p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between bg-card">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <TestTubes size={24}/>
                </div>
                <div>
                  <span className="font-semibold text-xl block">موعد #{r.appointment_id} - المريض: {r.patient_name || 'بدون اسم'}</span>
                  <span className="text-sm font-bold text-blue-700 block mt-1">العيادة الطالبة: {r.clinic_name}</span>
                  <span className="text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded font-bold mt-2 inline-block">التحاليل: {r.required_tests}</span>
                </div>
              </div>
              
              {/* MODIFIED BUTTON: Opens the modal and sets the active request ID instead of using prompt() */}
              <button 
                onClick={() => {
                  setSelectedRequestId(r.id);
                  setLabResultText('');
                  setShowModal(true);
                }} 
                className="bg-primary text-white px-5 py-2 rounded-md font-bold mt-4 md:mt-0 hover:bg-primary/90 flex items-center gap-2"
              >
                <CheckCircle size={18}/> إدخال النتيجة
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* NEW MODAL UI: Renders only when showModal is true */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-card p-6 rounded-2xl w-full max-w-lg shadow-2xl border">
            <h3 className="font-bold text-xl mb-4 text-purple-700 border-b pb-3 flex items-center gap-2">
              <TestTubes size={24}/> كتابة التقرير المخبري
            </h3>
            
            <label className="block text-sm font-semibold mb-2">تفاصيل نتيجة التحليل:</label>
            <textarea 
              value={labResultText} 
              onChange={(e) => setLabResultText(e.target.value)} 
              rows={6}
              className="w-full border border-input rounded-md p-4 bg-background outline-none focus:ring-2 focus:ring-purple-400 resize-none mb-6" 
              placeholder="اكتب التقرير المخبري المفصل هنا... (يمكنك كتابة عدة أسطر)" 
            />
            
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setShowModal(false)} 
                className="px-5 py-2.5 border rounded-md font-semibold hover:bg-muted"
              >
                إلغاء
              </button>
              <button 
                onClick={confirmSubmitResult} 
                className="px-6 py-2.5 bg-purple-600 text-white rounded-md font-bold hover:bg-purple-700"
              >
                تأكيد وإرسال للطبيب
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}