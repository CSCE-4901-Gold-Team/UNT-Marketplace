import React from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function Button({
    children,
    buttonColor = "green",
    buttonStyle = "bg",
    buttonSize = "md",
    showSpinner = false,
    type = "button",
    disabled,
    onClick,
}: {
    children?: React.ReactNode;
    buttonColor?: "blue" | "green";
    buttonStyle?: "bg" | "border";
    buttonSize?: "sm" | "md" | "lg";
    showSpinner?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {

    let classList = "min-w-[200px] rounded-md disabled:opacity-50 cursor-pointer";

    switch (buttonColor) {
        case "green":
            switch (buttonStyle) {
                case "bg":
                    classList += " text-white bg-green-600 hover:bg-green-700";
                    break;
                case "border":
                    classList += " text-green-600 border-green-600 hover:border-green-50";
                    break;
            }
            break;
        case "blue":
            switch (buttonStyle) {
                case "bg":
                    classList += " text-white bg-blue-600 hover:bg-blue-700";
                    break;
                case "border":
                    classList += " text-blue-600 border-blue-600 hover:border-blue-50";
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
