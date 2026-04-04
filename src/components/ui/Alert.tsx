"use client"

export default function Alert({
    children,
    alertType = "success",
}: {
    children?: React.ReactNode;
    alertType?: string;
}) {

    let alertClasses = "";
    switch (alertType) {
        case "info":
            alertClasses += "text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/30";
            break;
        case "error":
            alertClasses += "text-red-800 dark:text-red-200 border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/30";
            break;
        case "success":
            alertClasses += "text-green-800 dark:text-green-200 border-green-300 dark:border-green-700 bg-green-100 dark:bg-green-900/30";
            break;
        case "warning":
            alertClasses += "text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/30";
            break;
    }

    return (
        <div className={"flex items-center p-4 mb-4 border-t-4 " + alertClasses} role="alert">
            <div className="text-sm font-medium">
                {children}
            </div>
        </div>
    );
}
