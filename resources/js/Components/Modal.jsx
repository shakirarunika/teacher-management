import { AnimatePresence, motion } from 'framer-motion';

// Memakai pola framer-motion inline (seperti modal Holidays yang sudah jalan),
// bukan headlessui Dialog — yang di layout ini membuat panel ikut blur.
export default function Modal({
    children,
    show = false,
    maxWidth = '2xl',
    closeable = true,
    onClose = () => {},
}) {
    const maxWidthClass = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        '3xl': 'max-w-3xl',
    }[maxWidth];

    const close = () => {
        if (closeable) onClose();
    };

    return (
        <AnimatePresence>
            {show && (
                <div className="fixed inset-0 z-[200] overflow-y-auto">
                    <div className="flex min-h-screen items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 bg-black/25 dark:bg-black/50"
                            onClick={close}
                        />

                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            transition={{ duration: 0.2 }}
                            className={`relative w-full ${maxWidthClass} overflow-hidden rounded-2xl bg-white dark:bg-slate-900 dark:border dark:border-slate-800 shadow-2xl`}
                        >
                            {children}
                        </motion.div>
                    </div>
                </div>
            )}
        </AnimatePresence>
    );
}
