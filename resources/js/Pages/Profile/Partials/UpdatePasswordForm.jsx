import { Transition } from '@headlessui/react';
import { useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { EyeIcon, EyeSlashIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

function PasswordInput({ id, label, value, onChange, inputRef, autoComplete, error, placeholder }) {
    const [show, setShow] = useState(false);

    return (
        <div>
            <label htmlFor={id} className="block text-sm font-bold text-gray-700 dark:text-slate-350 mb-1.5">
                {label}
            </label>
            <div className="relative">
                <input
                    id={id}
                    ref={inputRef}
                    type={show ? 'text' : 'password'}
                    value={value}
                    onChange={onChange}
                    autoComplete={autoComplete}
                    className="w-full rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950/50 px-4 py-3 pr-12 text-gray-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm dark:shadow-none placeholder-gray-300 dark:placeholder-slate-700"
                    placeholder={placeholder}
                />
                <button
                    type="button"
                    onClick={() => setShow(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                    tabIndex={-1}
                >
                    {show ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
            </div>
            {error && <p className="mt-2 text-sm text-rose-500 font-medium">{error}</p>}
        </div>
    );
}

export default function UpdatePasswordForm() {
    const passwordInput = useRef();
    const currentPasswordInput = useRef();

    const { data, setData, errors, put, reset, processing, recentlySuccessful } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword = (e) => {
        e.preventDefault();
        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errors) => {
                if (errors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current?.focus();
                }
                if (errors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current?.focus();
                }
            },
        });
    };

    return (
        <form onSubmit={updatePassword} className="space-y-5">
            <PasswordInput
                id="current_password"
                label="Password Saat Ini"
                value={data.current_password}
                onChange={(e) => setData('current_password', e.target.value)}
                inputRef={currentPasswordInput}
                autoComplete="current-password"
                error={errors.current_password}
                placeholder="Masukkan password lama"
            />

            <PasswordInput
                id="password"
                label="Password Baru"
                value={data.password}
                onChange={(e) => setData('password', e.target.value)}
                inputRef={passwordInput}
                autoComplete="new-password"
                error={errors.password}
                placeholder="Minimal 8 karakter"
            />

            <PasswordInput
                id="password_confirmation"
                label="Konfirmasi Password Baru"
                value={data.password_confirmation}
                onChange={(e) => setData('password_confirmation', e.target.value)}
                autoComplete="new-password"
                error={errors.password_confirmation}
                placeholder="Ulangi password baru"
            />

            <div className="flex items-center gap-4 pt-2">
                <motion.button
                    type="submit"
                    disabled={processing}
                    whileTap={{ scale: 0.97 }}
                    whileHover={{ scale: 1.02 }}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold px-6 py-3 rounded-xl shadow-md shadow-blue-200 dark:shadow-none transition-colors"
                >
                    {processing ? (
                        <span className="animate-pulse">Memperbarui...</span>
                    ) : (
                        'Perbarui Password'
                    )}
                </motion.button>

                <Transition
                    show={recentlySuccessful}
                    enter="transition ease-in-out duration-300"
                    enterFrom="opacity-0 translate-x-2"
                    leave="transition ease-in-out duration-300"
                    leaveTo="opacity-0"
                >
                    <span className="flex items-center gap-1.5 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        <CheckCircleIcon className="w-4 h-4" />
                        Password diperbarui!
                    </span>
                </Transition>
            </div>
        </form>
    );
}
