import { useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrashIcon, XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function DeleteUserForm() {
    const [confirmingDeletion, setConfirmingDeletion] = useState(false);
    const passwordInput = useRef();

    const { data, setData, delete: destroy, processing, reset, errors, clearErrors } = useForm({
        password: '',
    });

    const deleteUser = (e) => {
        e.preventDefault();
        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current?.focus(),
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setConfirmingDeletion(false);
        clearErrors();
        reset();
    };

    return (
        <div>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-5">
                Setelah akun dihapus, semua data akan hilang secara permanen. Pastikan kamu sudah menyimpan data yang diperlukan sebelum melanjutkan.
            </p>

            <motion.button
                type="button"
                onClick={() => setConfirmingDeletion(true)}
                whileTap={{ scale: 0.97 }}
                whileHover={{ scale: 1.02 }}
                className="bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-450 border-2 border-rose-200 dark:border-rose-900/30 font-bold px-6 py-3 rounded-xl transition-colors flex items-center gap-2"
            >
                <TrashIcon className="w-4 h-4" />
                Hapus Akun Saya
            </motion.button>

            {/* Confirmation Modal */}
            <AnimatePresence>
                {confirmingDeletion && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
                        onClick={closeModal}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.85, y: 24 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.85, y: 24 }}
                            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                            className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border border-white/45 dark:border-slate-800/85 rounded-3xl shadow-2xl p-8 max-w-md w-full"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Icon */}
                            <motion.div
                                animate={{ rotate: [0, -8, 8, -4, 0] }}
                                transition={{ duration: 0.5, delay: 0.15 }}
                                className="flex items-center justify-center w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950/40 mx-auto mb-5"
                            >
                                <ExclamationTriangleIcon className="w-8 h-8 text-rose-500 dark:text-rose-400" />
                            </motion.div>

                            <h3 className="text-xl font-black text-gray-900 dark:text-slate-100 text-center mb-2">
                                Hapus Akun Kamu?
                            </h3>
                            <p className="text-gray-500 dark:text-slate-400 text-center text-sm mb-6">
                                Semua data kamu akan <strong className="text-rose-600 dark:text-rose-450">dihapus permanen</strong> dan tidak bisa dipulihkan. Masukkan password kamu untuk konfirmasi.
                            </p>

                            <form onSubmit={deleteUser} className="space-y-4">
                                <div>
                                    <label htmlFor="delete_password" className="block text-sm font-bold text-gray-700 dark:text-slate-350 mb-1.5">
                                        Password
                                    </label>
                                    <input
                                        id="delete_password"
                                        type="password"
                                        ref={passwordInput}
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="Masukkan password kamu"
                                        className="w-full rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950/50 px-4 py-3 text-gray-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all shadow-sm dark:shadow-none placeholder-gray-300 dark:placeholder-slate-700"
                                    />
                                    {errors.password && (
                                        <p className="mt-2 text-sm text-rose-500 font-medium">{errors.password}</p>
                                    )}
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <motion.button
                                        type="button"
                                        onClick={closeModal}
                                        whileTap={{ scale: 0.96 }}
                                        className="flex-1 py-3 rounded-2xl border-2 border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300 font-bold hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <XMarkIcon className="w-4 h-4" />
                                        Batal
                                    </motion.button>
                                    <motion.button
                                        type="submit"
                                        disabled={processing}
                                        whileTap={{ scale: 0.96 }}
                                        className="flex-1 py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 disabled:opacity-60 text-white font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-rose-200 dark:shadow-none"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                        {processing ? 'Menghapus...' : 'Ya, Hapus'}
                                    </motion.button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
