import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import ApplicationLogo from '@/Components/ApplicationLogo';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Log in" />

            <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#6F4E37]/5 via-[#F5EDE8]/30 to-white px-4 py-8">
                <div className="w-full max-w-3xl">
                    {/* Card – now larger and more spacious */}
                    <div className="bg-white rounded-3xl shadow-xl border border-gray-100/50 p-8 sm:p-12 transition-all duration-300 hover:shadow-2xl">
                        <div className="flex flex-col md:flex-row md:items-start gap-8 md:gap-12">
                            {/* Left side – branding */}
                            <div className="flex-1 text-center md:text-left">
                                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F5EDE8] mb-4 md:mb-6">
                                    <ApplicationLogo className="h-12 w-auto fill-current text-[#6F4E37]" />
                                </div>
                                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Welcome back</h1>
                                <p className="text-sm text-gray-500 mt-2">Sign in to your account to continue</p>
                                <div className="hidden md:block mt-6 text-sm text-gray-400">
                                    <p>Access your dashboard, manage inventory, and track your business with ease.</p>
                                </div>
                            </div>

                            {/* Right side – form */}
                            <div className="flex-1">
                                {status && (
                                    <div className="mb-4 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                                        {status}
                                    </div>
                                )}

                                <form onSubmit={submit} className="space-y-5">
                                    <div>
                                        <InputLabel htmlFor="email" value="Email address" className="text-sm font-medium text-gray-700" />
                                        <TextInput
                                            id="email"
                                            type="email"
                                            name="email"
                                            value={data.email}
                                            className="mt-1.5 block w-full rounded-xl border-gray-200 bg-gray-50/60 focus:bg-white focus:border-[#6F4E37] focus:ring-2 focus:ring-[#6F4E37]/20 transition-all duration-200 placeholder:text-gray-400"
                                            placeholder="you@example.com"
                                            autoComplete="username"
                                            isFocused={true}
                                            onChange={(e) => setData('email', e.target.value)}
                                        />
                                        <InputError message={errors.email} className="mt-1.5" />
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between">
                                            <InputLabel htmlFor="password" value="Password" className="text-sm font-medium text-gray-700" />
                                            {canResetPassword && (
                                                <Link
                                                    href={route('password.request')}
                                                    className="text-xs font-medium text-[#6F4E37] hover:text-[#5A3E2B] hover:underline transition-colors"
                                                >
                                                    Forgot password?
                                                </Link>
                                            )}
                                        </div>
                                        <TextInput
                                            id="password"
                                            type="password"
                                            name="password"
                                            value={data.password}
                                            className="mt-1.5 block w-full rounded-xl border-gray-200 bg-gray-50/60 focus:bg-white focus:border-[#6F4E37] focus:ring-2 focus:ring-[#6F4E37]/20 transition-all duration-200 placeholder:text-gray-400"
                                            placeholder="••••••••"
                                            autoComplete="current-password"
                                            onChange={(e) => setData('password', e.target.value)}
                                        />
                                        <InputError message={errors.password} className="mt-1.5" />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                                            <Checkbox
                                                name="remember"
                                                checked={data.remember}
                                                onChange={(e) => setData('remember', e.target.checked)}
                                                className="rounded-md border-gray-300 text-[#6F4E37] focus:ring-2 focus:ring-[#6F4E37]/30 transition-all"
                                            />
                                            <span>Remember me</span>
                                        </label>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full inline-flex justify-center items-center px-4 py-3 bg-[#6F4E37] text-white text-sm font-semibold rounded-xl hover:bg-[#5A3E2B] focus:outline-none focus:ring-2 focus:ring-[#6F4E37]/40 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                                    >
                                        {processing ? (
                                            <span className="flex items-center gap-2">
                                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Signing in...
                                            </span>
                                        ) : (
                                            'Sign in'
                                        )}
                                    </button>
                                </form>

                                <p className="mt-6 text-center text-sm text-gray-500">
                                    New to FMS?{' '}
                                    <Link href={route('register')} className="text-[#6F4E37] font-medium hover:text-[#5A3E2B] hover:underline transition-colors">
                                        Create an account
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}
