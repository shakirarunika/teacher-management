import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

export default function UpdateProfileInformation({ mustVerifyEmail, status }) {
    const user = usePage().props.auth.user;

    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        name: user.name,
        email: user.email,
    });

    const submit = (e) => {
        e.preventDefault();
        patch(route('profile.update'));
    };

    return (
        <form onSubmit={submit} className="space-y-5">
            {/* Name */}
            <div>
                <label htmlFor="name" className="block text-sm font-bold text-gray-700 mb-1.5">
                    Nama Lengkap
                </label>
                <input
                    id="name"
                    type="text"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    required
                    autoFocus
                    autoComplete="name"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm placeholder-gray-300"
                    placeholder="Nama lengkap kamu"
                />
                {errors.name && <p className="mt-2 text-sm text-rose-500 font-medium">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
                <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-1.5">
                    Alamat Email
                </label>
                <input
                    id="email"
                    type="email"
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    required
                    autoComplete="username"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm placeholder-gray-300"
                    placeholder="email@kamu.com"
                />
                {errors.email && <p className="mt-2 text-sm text-rose-500 font-medium">{errors.email}</p>}
            </div>

            {/* Email Verification */}
            {mustVerifyEmail && user.email_verified_at === null && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                    <p className="text-sm text-amber-800 font-medium">
                        Email kamu belum diverifikasi.{' '}
                        <Link
                            href={route('verification.send')}
                            method="post"
                            as="button"
                            className="underline font-bold text-amber-700 hover:text-amber-900"
                        >
                            Kirim ulang email verifikasi.
                        </Link>
                    </p>
                    {status === 'verification-link-sent' && (
                        <p className="mt-1 text-sm font-bold text-emerald-600">
                            Link verifikasi baru telah dikirim!
                        </p>
                    )}
                </div>
            )}

            {/* Submit */}
            <div className="flex items-center gap-4 pt-2">
                <motion.button
                    type="submit"
                    disabled={processing}
                    whileTap={{ scale: 0.97 }}
                    whileHover={{ scale: 1.02 }}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold px-6 py-3 rounded-xl shadow-md shadow-indigo-200 transition-colors flex items-center gap-2"
                >
                    {processing ? (
                        <span className="animate-pulse">Menyimpan...</span>
                    ) : (
                        'Simpan Perubahan'
                    )}
                </motion.button>

                <Transition
                    show={recentlySuccessful}
                    enter="transition ease-in-out duration-300"
                    enterFrom="opacity-0 translate-x-2"
                    leave="transition ease-in-out duration-300"
                    leaveTo="opacity-0"
                >
                    <span className="flex items-center gap-1.5 text-sm font-bold text-emerald-600">
                        <CheckCircleIcon className="w-4 h-4" />
                        Tersimpan!
                    </span>
                </Transition>
            </div>
        </form>
    );
}
