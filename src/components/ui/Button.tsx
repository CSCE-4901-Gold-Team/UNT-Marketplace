import React from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function Button({
    children,
    buttonColor = "green",
    buttonVariant = "primary",
    buttonStyle = "bg",
    buttonSize = "md",
    showSpinner = false,
    type = "button",
    disabled,
    onClick,
    buttonClasses = ""
}: {
    children?: React.ReactNode;
    buttonColor?: "blue" | "green" | "red" | "gray";
    buttonVariant?: "primary" | "secondary" | "danger";
    buttonStyle?: "bg" | "border" | "icon" | "text";
    buttonSize?: "sm" | "md" | "lg";
    showSpinner?: boolean;
    buttonClasses?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {

    let classList = "rounded-md disabled:opacity-50 cursor-pointer text-center";

    // Handle buttonVariant shorthand
    if (buttonVariant === "danger") {
        buttonColor = "red";
    } else if (buttonVariant === "secondary") {
        buttonColor = "gray";
    } else if (buttonVariant === "primary") {
        buttonColor = buttonColor || "green";
    }

    switch (buttonColor) {
        case "green":
            switch (buttonStyle) {
                case "bg":
                    classList += " text-white bg-green-600 hover:bg-green-700";
                    break;
                case "border":
                    classList += " text-green-600 border border-green-600 hover:bg-green-600 hover:text-white";
                    break;
                case "icon":
                    classList += " text-white bg-green-600 hover:bg-green-700";
                    break;
            }
            break;
        case "blue":
            switch (buttonStyle) {
                case "bg":
                    classList += " text-white bg-blue-500 hover:bg-blue-700";
                    break;
                case "border":
                    classList += " text-blue-500 border border-blue-500 hover:border-blue-50";
                    break;
                case "icon":
                    classList += " text-white bg-blue-500 hover:bg-blue-500";
                    break;
            }
            break;
        case "red":
            switch (buttonStyle) {
                case "bg":
                    classList += " text-white bg-red-600 hover:bg-red-700";
                    break;
                case "border":
                    classList += " text-red-600 border border-red-600 hover:bg-red-600 hover:text-white";
                    break;
            }
            break;
        case "gray":
            switch (buttonStyle) {
                case "bg":
                    classList += " text-gray-700 bg-gray-200 hover:bg-gray-300";
                    break;
                case "border":
                    classList += " text-gray-700 border border-gray-300 hover:bg-gray-50";
                    break;
            }
            break;
    }

    switch (buttonSize) {
        case "sm":
            classList += " px-2 py-1.5 text-sm";
            break;
        case "md":
            classList += " px-4 py-3 font-bold";
            break;
        case "lg":
            classList += " px-6 py-4.5 text-lg font-bold";
            break;
    }

    // Custom classes applied last to allow overriding default classes
    classList += ` ${buttonClasses}`;

    return (
        <button
            type={ type }
            className={ classList }
            disabled={ disabled || showSpinner }
            onClick={onClick}
        >
            { showSpinner ? (
                <LoadingSpinner />
            ) : children }
        </button>
    );
}
