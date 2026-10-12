'use client';
import { useEffect, useState, useContext } from 'react';
import { LocaleContext } from '@/providers/locale-provider';
import { UserPlus, Users, Edit, Key, ShieldOff, ShieldCheck } from 'lucide-react';

export default function AdminDashboard() {
  const { locale } = useContext(LocaleContext);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [clinics, setClinics] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);

  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    role: 'doctor',
    clinic_id: 1
  });
  const [formLoading, setFormLoading] = useState(false);

  // تعريف المتغير لسحب الرابط السحابي
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(row => row.trim().startsWith('token='));
    const token = tokenCookie ? tokenCookie.split('=')[1] : null;

    if (!token) {
      setLoading(false);
      return;
    }

    // جلب الإحصائيات (تم التعديل)
    fetch(`${API_URL}/api/v1/admin/stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then((r) => r.ok ? r.json() : { stats: {} })
      .then((data) => {
        setStats(data.stats || {});
      })
      .catch(() => {});

    // جلب قائمة العيادات والأقسام (تم التعديل)
    fetch(`${API_URL}/api/v1/admin/clinics`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then((r) => r.ok ? r.json() : [])
      .then((data) => {
        setClinics(data);
        if (data.length > 0) {
          setNewUser(prev => ({ ...prev, clinic_id: data[0].id }));
        }
      });

    // جلب قائمة المستخدمين لجدول الإدارة
    fetchUsers(token);
  }, []);

  const fetchUsers = (token: string) => {
    fetch(`${API_URL}/api/v1/admin/users`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : [])
      .then((data) => {
        setUsersList(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  const getAvailableRoles = () => {
    const selectedClinic = clinics.find(c => c.id === Number(newUser.clinic_id));
    const clinicName = selectedClinic ? selectedClinic.name : '';

    if (clinicName.includes('الصيدلية')) {
      return [
        { value: 'pharmacist', label: locale === 'ar' ? 'صيدلي' : 'Pharmacist' },
        { value: 'assistant_pharmacist', label: locale === 'ar' ? 'مساعد صيدلي' : 'Assistant Pharmacist' }
      ];
    } else if (clinicName.includes('المختبر')) {
      return [
        { value: 'lab_doctor', label: locale === 'ar' ? 'طبيب مخبري' : 'Lab Doctor' },
        { value: 'lab_tech', label: locale === 'ar' ? 'فني مختبر' : 'Lab Technician' },
        { value: 'radiology_tech', label: locale === 'ar' ? 'فني أشعة' : 'Radiology Technician' },
        { value: 'nurse', label: locale === 'ar' ? 'ممرض' : 'Nurse' }
      ];
    } else {
      return [
        { value: 'doctor', label: locale === 'ar' ? 'طبيب مختص' : 'Specialist Doctor' },
        { value: 'nurse', label: locale === 'ar' ? 'ممرض/ة' : 'Nurse' },
        { value: 'receptionist', label: locale === 'ar' ? 'موظف استقبال' : 'Receptionist' }
      ];
    }
  };

  const handleClinicChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newClinicId = Number(e.target.value);
    const selectedClinic = clinics.find(c => c.id === newClinicId);
    const clinicName = selectedClinic ? selectedClinic.name : '';

    let defaultRole = 'doctor';
    if (clinicName.includes('الصيدلية')) defaultRole = 'pharmacist';
    else if (clinicName.includes('المختبر')) defaultRole = 'lab_doctor';

    setNewUser({ ...newUser, clinic_id: newClinicId, role: defaultRole });
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    const token = document.cookie.split('token=')[1]?.split(';')[0];

    try {
      // تم التعديل
      const res = await fetch(`${API_URL}/api/v1/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newUser)
      });

      if (res.ok) {
        alert(locale === 'ar' ? 'تم إنشاء حساب الكادر بنجاح!' : 'Account created successfully!');
        setNewUser(prev => ({ ...prev, email: '', password: '' }));
        fetchUsers(token); 
      } else {
        const errData = await res.json();
        alert(`فشل الإنشاء: ${errData.detail || 'خطأ'}`);
      }
    } catch (error) {
      alert(locale === 'ar' ? 'خطأ في الاتصال' : 'Connection error');
    } finally {
      setFormLoading(false);
    }
  };

  const toggleUserStatus = async (userId: number) => {
    const token = document.cookie.split('token=')[1]?.split(';')[0];
    // تم التعديل
    const res = await fetch(`${API_URL}/api/v1/admin/users/${userId}/status`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) fetchUsers(token);
  };

  const handleResetPassword = async (userId: number) => {
    const newPassword = prompt(locale === 'ar' ? 'أدخل كلمة المرور الجديدة:' : 'Enter new password:');
    if (!newPassword) return;

    const token = document.cookie.split('token=')[1]?.split(';')[0];
    // تم التعديل
    const res = await fetch(`${API_URL}/api/v1/admin/users/${userId}/password`, {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ new_password: newPassword })
    });

    if (res.ok) alert(locale === 'ar' ? 'تم تغيير كلمة المرور بنجاح' : 'Password updated successfully');
  };

  const handleEditUser = async (user: any) => {
    const newRole = prompt(locale === 'ar' ? 'أدخل الصلاحية الجديدة (doctor, nurse, receptionist):' : 'Enter new role:', user.role);
    if (!newRole) return;

    const token = document.cookie.split('token=')[1]?.split(';')[0];
    // تم التعديل
    const res = await fetch(`${API_URL}/api/v1/admin/users/${user.id}`, {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ role: newRole, clinic_id: user.clinic_id }) 
    });

    if (res.ok) fetchUsers(token);
  };

  return (
    <section className="space-y-8 p-8 max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold text-primary">
        {locale === 'ar' ? 'لوحة تحكم الإدارة' : 'Admin Dashboard'}
      </h2>

      {!loading && stats ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border p-5 shadow-sm bg-card">
             <p className="text-sm text-muted-foreground">المواعيد المجدولة</p>
             <p className="text-3xl font-bold mt-2">{stats.scheduled || 0}</p>
          </div>
          <div className="rounded-xl border p-5 shadow-sm bg-card">
             <p className="text-sm text-muted-foreground">في الانتظار</p>
             <p className="text-3xl font-bold mt-2">{stats.checked_in || 0}</p>
          </div>
          <div className="rounded-xl border p-5 shadow-sm bg-card">
             <p className="text-sm text-muted-foreground">عند الطبيب</p>
             <p className="text-3xl font-bold mt-2">{stats.with_doctor || 0}</p>
          </div>
          <div className="rounded-xl border p-5 shadow-sm bg-card">
             <p className="text-sm text-muted-foreground">المكتملة</p>
             <p className="text-3xl font-bold mt-2">{stats.completed || 0}</p>
          </div>
        </div>
      ) : (
        <p className="text-muted-foreground animate-pulse">جاري تحميل البيانات…</p>
      )}

      <div className="rounded-xl border p-6 bg-card shadow-sm mt-8">
        <h3 className="text-xl font-semibold mb-6 flex items-center gap-2 border-b pb-3">
          <UserPlus className="text-primary w-6 h-6" />
          {locale === 'ar' ? 'إنشاء حساب كادر طبي / مساند وتخصيص القسم' : 'Create Staff Account'}
        </h3>

        <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold mb-2">البريد الإلكتروني</label>
            <input 
              type="email" required
              value={newUser.email}
              onChange={(e) => setNewUser({...newUser, email: e.target.value})}
              placeholder="staff@clinic.com"
              className="w-full border rounded-lg p-3 bg-background outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">كلمة المرور</label>
            <input 
              type="password" required
              value={newUser.password}
              onChange={(e) => setNewUser({...newUser, password: e.target.value})}
              placeholder="••••••••"
              className="w-full border rounded-lg p-3 bg-background outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">اختر القسم / العيادة</label>
            <select 
              value={newUser.clinic_id}
              onChange={handleClinicChange}
              className="w-full border rounded-lg p-3 bg-background outline-none focus:ring-2 focus:ring-primary/40"
            >
              {clinics.map((clinic) => (
                <option key={clinic.id} value={clinic.id}>{clinic.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">المسمى الوظيفي (يتم تحديثه تلقائياً)</label>
            <select 
              value={newUser.role}
              onChange={(e) => setNewUser({...newUser, role: e.target.value})}
              className="w-full border rounded-lg p-3 bg-background outline-none focus:ring-2 focus:ring-primary/40"
            >
              {getAvailableRoles().map((roleOpt) => (
                <option key={roleOpt.value} value={roleOpt.value}>
                  {roleOpt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 pt-4">
            <button 
              type="submit" 
              disabled={formLoading}
              className="w-full md:w-auto bg-primary text-primary-foreground px-8 py-3 rounded-lg font-bold hover:bg-primary/90 transition-colors shadow-md disabled:opacity-50"
            >
              {formLoading ? 'جاري الإنشاء...' : 'إنشاء الحساب وتخصيص القسم'}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-xl border p-6 bg-card shadow-sm mt-8 overflow-hidden">
        <h3 className="text-xl font-semibold mb-6 flex items-center gap-2 border-b pb-3">
          <Users className="text-primary w-6 h-6" />
          {locale === 'ar' ? 'إدارة حسابات الكادر والموظفين' : 'Manage Staff Accounts'}
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 text-muted-foreground border-b">
                <th className="p-4 font-semibold text-right">{locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}</th>
                <th className="p-4 font-semibold text-right">{locale === 'ar' ? 'الصلاحية (Role)' : 'Role'}</th>
                <th className="p-4 font-semibold text-right">{locale === 'ar' ? 'العيادة المرتبطة' : 'Clinic'}</th>
                <th className="p-4 font-semibold text-center">{locale === 'ar' ? 'الحالة' : 'Status'}</th>
                <th className="p-4 font-semibold text-center">{locale === 'ar' ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {usersList.map((user) => (
                <tr key={user.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors text-right">
                  <td className="p-4 font-medium" dir="ltr">{user.email}</td>
                  <td className="p-4">
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-semibold">
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4 text-sm">
                    {clinics.find(c => c.id === user.clinic_id)?.name || 'عام / غير محدد'}
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center justify-center gap-1 w-fit mx-auto ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {user.is_active ? (locale === 'ar' ? 'نشط' : 'Active') : (locale === 'ar' ? 'موقوف' : 'Deactivated')}
                    </span>
                  </td>
                  <td className="p-4 flex items-center justify-center gap-4">
                    <button onClick={() => handleEditUser(user)} className="text-blue-600 hover:text-blue-800 transition" title="تعديل الصلاحية">
                      <Edit size={20} />
                    </button>
                    <button onClick={() => handleResetPassword(user.id)} className="text-amber-600 hover:text-amber-800 transition" title="إعادة تعيين كلمة المرور">
                      <Key size={20} />
                    </button>
                    <button onClick={() => toggleUserStatus(user.id)} className={`transition ${user.is_active ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}`} title={user.is_active ? "إيقاف الحساب" : "تنشيط الحساب"}>
                      {user.is_active ? <ShieldOff size={20} /> : <ShieldCheck size={20} />}
                    </button>
                  </td>
                </tr>
              ))}
              {usersList.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    {locale === 'ar' ? 'لا يوجد حسابات مسجلة.' : 'No users found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}