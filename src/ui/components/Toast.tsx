import { AnimatePresence, motion } from 'framer-motion';

export function Toast({ toast }: { toast: { msg: string; key: number } | null }) {
  return (
    <div className="pointer-events-none absolute left-0 right-0 top-[86px] z-50 flex justify-center px-4">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.key}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-[380px] rounded-lg border-2 border-[#3fe0d0] bg-[#2a1058]/95 px-4 py-2 text-center text-sm font-extrabold text-white shadow-lg"
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
