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
            alertClasses += "text-blue-800 border-blue-300 bg-blue-50";
            break;
        case "error":
            alertClasses += "text-red-800 border-red-300 bg-red-50";
            break;
        case "success":
            alertClasses += "text-green-800 border-green-300 bg-green-100";
            break;
        case "warning":
            alertClasses += "text-yellow-800 border-yellow-300 bg-yellow-50";
            break;
        case "info":
            alertClasses += "border-gray-300 bg-gray-50";
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
