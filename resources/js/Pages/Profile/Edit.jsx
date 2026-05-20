import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import DeleteUserForm from './Partials/DeleteUserForm';
import { UserCircleIcon, LockClosedIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function Edit({ mustVerifyEmail, status }) {
    const user = usePage().props.auth.user;

    const container = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.12 } },
    };
    const item = {
        hidden: { opacity: 0, y: 24 },
        show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 26 } },
    };

    return (
        <AuthenticatedLayout>
            <Head title="Profile" />

            <div className="py-6 sm:py-8 relative z-10 min-h-screen">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* Profile Hero Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                        className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] p-8 mb-8 text-white shadow-2xl shadow-indigo-500/30 relative overflow-hidden"
                    >
                        {/* Decorative circles */}
                        <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full" />
                        <div className="absolute -bottom-10 -left-6 w-32 h-32 bg-white/10 rounded-full" />

                        <div className="relative flex items-center gap-6">
                            {/* Avatar */}
                            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-4xl font-black shadow-lg border border-white/30 flex-shrink-0">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className="text-white/70 text-sm font-bold uppercase tracking-widest mb-1">Teacher Account</p>
                                <h2 className="text-3xl font-black tracking-tight">{user.name}</h2>
                                <p className="text-white/80 font-medium mt-0.5">{user.email}</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Cards */}
                    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 pb-12">

                        {/* Profile Info */}
                        <motion.div variants={item} className="bg-white/70 backdrop-blur-xl border border-white rounded-[2rem] p-7 shadow-xl shadow-indigo-100/50">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                                    <UserCircleIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-gray-900">Informasi Profil</h3>
                                    <p className="text-sm text-gray-500">Perbarui nama dan alamat email kamu.</p>
                                </div>
                            </div>
                            <UpdateProfileInformationForm
                                mustVerifyEmail={mustVerifyEmail}
                                status={status}
                            />
                        </motion.div>

                        {/* Password */}
                        <motion.div variants={item} className="bg-white/70 backdrop-blur-xl border border-white rounded-[2rem] p-7 shadow-xl shadow-indigo-100/50">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                                    <LockClosedIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-gray-900">Ubah Password</h3>
                                    <p className="text-sm text-gray-500">Gunakan password yang kuat dan unik.</p>
                                </div>
                            </div>
                            <UpdatePasswordForm />
                        </motion.div>

                        {/* Delete Account */}
                        <motion.div variants={item} className="bg-white/70 backdrop-blur-xl border-2 border-rose-100 rounded-[2rem] p-7 shadow-xl shadow-rose-100/50">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600">
                                    <TrashIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-gray-900">Hapus Akun</h3>
                                    <p className="text-sm text-gray-500">Tindakan ini permanen dan tidak bisa dibatalkan.</p>
                                </div>
                            </div>
                            <DeleteUserForm />
                        </motion.div>

                    </motion.div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
