import { toast, Slide, ToastOptions } from "react-toastify";

const toastConfig: ToastOptions = {
    position: "bottom-right",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "dark",
    transition: Slide,
}

export const toastService = {
    toast: (message: string, type = "info") => {
        switch (type) {
            case "info":
                toast.info(message, toastConfig);
                break;
            case "warn":
                toast.warn(message, toastConfig);
                break;
            case "error":
                toast.error(message, toastConfig);
                break;
            case "success":
            default:
                toast.success(message, toastConfig);
                break;
        }
    }
}
