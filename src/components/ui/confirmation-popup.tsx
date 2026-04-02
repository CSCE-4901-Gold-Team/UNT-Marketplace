"use client";

type ConfirmationPopupProps = {
    open: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    pending?: boolean;
    tone?: "default" | "danger";
    onConfirm: () => void | Promise<void>;
    onClose: () => void;
};

export default function ConfirmationPopup({
    open,
    title,
    message,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    pending = false,
    tone = "default",
    onConfirm,
    onClose
}: ConfirmationPopupProps) {
    if (!open) return null;

    const confirmButtonClasses = tone === "danger"
        ? "bg-red-500 hover:bg-red-600"
        : "bg-green hover:opacity-90";

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl w-[450px] p-6 shadow-lg">
                <h3 className="text-2xl font-bold mb-4 text-center">{title}</h3>
                <p className="text-gray-600 text-center">{message}</p>

                <div className="flex justify-end gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 rounded-xl hover:bg-gray-300 transition disabled:opacity-50"
                        disabled={pending}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-4 py-2 text-white rounded-xl transition disabled:opacity-50 ${confirmButtonClasses}`}
                        disabled={pending}
                    >
                        {pending ? "Working..." : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
