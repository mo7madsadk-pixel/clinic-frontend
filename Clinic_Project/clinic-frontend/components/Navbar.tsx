'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { Moon, Sun, LogOut } from 'lucide-react';

export const Navbar = () => {
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const handleLogout = () => {
    // حذف التوكن من الكوكيز عن طريق إنهاء صلاحيته
    document.cookie = 'token=; path=/; max-age=0; SameSite=Lax';
    // التوجيه إلى صفحة تسجيل الدخول
    router.push('/login');
  };

  return (
    <nav className="bg-primary text-primary-foreground p-4 flex justify-between items-center shadow-md">
      <Link href="/" className="font-bold text-xl">
        منظّمة العيادة والمستوصف
      </Link>

      <div className="flex items-center space-x-4 space-x-reverse">
        {/* زر تبديل الوضع الليلي/النهاري */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded bg-background text-foreground hover:bg-muted transition-colors"
          title="تبديل المظهر"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* زر تسجيل الخروج */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 bg-destructive/10 text-destructive-foreground bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md font-medium transition-colors text-sm shadow-sm"
        >
          <LogOut size={16} />
          تسجيل الخروج
        </button>
      </div>
    </nav>
  );
};

export default Navbar;