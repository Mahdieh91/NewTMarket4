// src/app/test/page.tsx
'use client';

export default function TestPage() {
  const testLogin = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/token/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'azadeh', password: 'azadeh123' }),
      });
      const data = await res.json();
      console.log('✅ پاسخ موفق:', data);
      alert('موفق! توکن: ' + data.access);
    } catch (err: any) {
      console.error('❌ خطا:', err);
      alert('خطا: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <button
        onClick={testLogin}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg text-lg hover:bg-blue-700"
      >
        تست لاگین
      </button>
    </div>
  );
}