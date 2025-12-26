export function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Delete', confirmStyle = 'danger' }) {
  if (!isOpen) return null

  const confirmClass = confirmStyle === 'danger'
    ? 'bg-red-500 text-white active:bg-red-600'
    : 'bg-blue-500 text-white active:bg-blue-600'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
      />
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {title}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {message}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-lg bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={'flex-1 py-3 rounded-lg font-medium ' + confirmClass}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
