'use client';

import { useState, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { LocaleContext } from '@/providers/locale-provider';

export default function LoginPage() {
  const { locale } = useContext(LocaleContext);
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${API_URL}/api/v1/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      if (!res.ok) {
        throw new Error(locale === 'ar' ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة' : 'Invalid email or password');
      }

      const data = await res.json();
      const token = data.access_token;
      
      document.cookie = `token=${token}; path=/; max-age=86400; SameSite=Lax`;

      // 👈 تم استبدال الرابط الثابت بالمتغير الديناميكي هنا
      const userRes = await fetch(`${API_URL}/api/v1/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!userRes.ok) {
        throw new Error(locale === 'ar' ? 'فشل التحقق من صلاحيات الحساب' : 'Failed to verify account permissions');
      }

      const userData = await userRes.json();
      const userRole = userData.role;

      // التوجيه الديناميكي والصحيح بناءً على الصلاحية الفعلية (Role)
      switch (userRole) {
        case 'admin':
          router.push('/admin');
          break;
        case 'doctor':
          router.push('/doctor');
          break;
        case 'nurse':
          router.push('/nurse');
          break;
        case 'receptionist':
          router.push('/receptionist');
          break;
        case 'lab_doctor':
        case 'lab_tech':
        case 'radiology_tech':
          router.push('/lab');
          break;
        case 'pharmacist':
        case 'assistant_pharmacist':
          router.push('/pharmacy');
          break;
        default:
          router.push('/receptionist'); 
      }

    } catch (err: any) {
      setError(err.message || (locale === 'ar' ? 'حدث خطأ أثناء تسجيل الدخول' : 'An error occurred during login'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-card border rounded-xl shadow-lg p-8">
        
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
            🏥
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {locale === 'ar' ? 'نظام إدارة المستوصف الطبي' : 'Clinic Management System'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {locale === 'ar' ? 'بوابة الكادر الطبي والإداري' : 'Medical & Administrative Staff Portal'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-md text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              {locale === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
            </label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-input rounded-md p-2.5 bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              placeholder="name@clinic.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              {locale === 'ar' ? 'كلمة المرور' : 'Password'}
            </label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-input rounded-md p-2.5 bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary text-primary-foreground py-3 rounded-md hover:bg-primary/90 transition-colors font-semibold text-lg mt-2 shadow-sm disabled:opacity-50"
          >
            {loading ? (locale === 'ar' ? 'جاري تسجيل الدخول...' : 'Logging in...') : (locale === 'ar' ? 'تسجيل الدخول' : 'Login')}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          {locale === 'ar' ? 'اتصال آمن ومشفر للبيانات الطبية' : 'Secure encrypted connection for medical data'}
        </div>

      </div>
    </div>
  );
}