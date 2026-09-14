import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import ApplicationLogo from '@/Components/ApplicationLogo';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Register" />

            <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#6F4E37]/5 via-[#F5EDE8]/30 to-white px-4 py-8">
                <div className="w-full max-w-3xl">
                    <div className="bg-white rounded-3xl shadow-xl border border-gray-100/50 p-8 sm:p-12 transition-all duration-300 hover:shadow-2xl">
                        <div className="flex flex-col md:flex-row md:items-start gap-8 md:gap-12">
                            {/* Left – branding */}
                            <div className="flex-1 text-center md:text-left">
                                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F5EDE8] mb-4 md:mb-6">
                                    <ApplicationLogo className="h-12 w-auto fill-current text-[#6F4E37]" />
                                </div>
                                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Create account</h1>
                                <p className="text-sm text-gray-500 mt-2">Get started with FMS</p>
                                <div className="hidden md:block mt-6 text-sm text-gray-400">
                                    <p>Join thousands of businesses managing inventory, employees, and sales.</p>
                                </div>
                            </div>

                            {/* Right – form */}
                            <div className="flex-1">
                                <form onSubmit={submit} className="space-y-4">
                                    <div>
                                        <InputLabel htmlFor="name" value="Full name" className="text-sm font-medium text-gray-700" />
                                        <TextInput
                                            id="name"
                                            name="name"
                                            value={data.name}
                                            className="mt-1.5 block w-full rounded-xl border-gray-200 bg-gray-50/60 focus:bg-white focus:border-[#6F4E37] focus:ring-2 focus:ring-[#6F4E37]/20 transition-all duration-200 placeholder:text-gray-400"
                                            placeholder="John Doe"
                                            autoComplete="name"
                                            isFocused={true}
                                            onChange={(e) => setData('name', e.target.value)}
                                            required
                                        />
                                        <InputError message={errors.name} className="mt-1.5" />
                                    </div>

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
                                            onChange={(e) => setData('email', e.target.value)}
                                            required
                                        />
                                        <InputError message={errors.email} className="mt-1.5" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="password" value="Password" className="text-sm font-medium text-gray-700" />
                                        <TextInput
                                            id="password"
                                            type="password"
                                            name="password"
                                            value={data.password}
                                            className="mt-1.5 block w-full rounded-xl border-gray-200 bg-gray-50/60 focus:bg-white focus:border-[#6F4E37] focus:ring-2 focus:ring-[#6F4E37]/20 transition-all duration-200 placeholder:text-gray-400"
                                            placeholder="••••••••"
                                            autoComplete="new-password"
                                            onChange={(e) => setData('password', e.target.value)}
                                            required
                                        />
                                        <InputError message={errors.password} className="mt-1.5" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="password_confirmation" value="Confirm password" className="text-sm font-medium text-gray-700" />
                                        <TextInput
                                            id="password_confirmation"
                                            type="password"
                                            name="password_confirmation"
                                            value={data.password_confirmation}
                                            className="mt-1.5 block w-full rounded-xl border-gray-200 bg-gray-50/60 focus:bg-white focus:border-[#6F4E37] focus:ring-2 focus:ring-[#6F4E37]/20 transition-all duration-200 placeholder:text-gray-400"
                                            placeholder="••••••••"
                                            autoComplete="new-password"
                                            onChange={(e) => setData('password_confirmation', e.target.value)}
                                            required
                                        />
                                        <InputError message={errors.password_confirmation} className="mt-1.5" />
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
                                                Creating account...
                                            </span>
                                        ) : (
                                            'Create account'
                                        )}
                                    </button>
                                </form>

                                <p className="mt-6 text-center text-sm text-gray-500">
                                    Already have an account?{' '}
                                    <Link href={route('login')} className="text-[#6F4E37] font-medium hover:text-[#5A3E2B] hover:underline transition-colors">
                                        Sign in
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
