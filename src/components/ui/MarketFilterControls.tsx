"use client"

import React, { SetStateAction, useState } from "react";
import { ListingFilters } from "@/types/ListingFilters";
import CurrencyInput from "@/components/ui/CurrencyInput";
import TextInput from "@/components/ui/TextInput";
import Button from "@/components/ui/Button";
import { FaFilter } from "react-icons/fa";
import { $Enums } from "@/generated/prisma";
import UserRole = $Enums.UserRole;

export default function MarketFilterControls({
    setFilterObjectAction,
    filterObject,
    refreshListingsAction,
    userRole
}: {
    setFilterObjectAction: React.Dispatch<SetStateAction<ListingFilters>>
    filterObject: ListingFilters;
    refreshListingsAction: () => void;
    userRole: UserRole
}) {
    const [showFilters, setShowFilters] = useState(false);

    return (
        <div className="listing-filter-controls-wrapper relative">
            <div className="listing-filter-control flex gap-4">
                <Button
                    buttonStyle="border"
                    buttonClasses="flex items-center gap-x-2"
                    onClick={() => setShowFilters(!showFilters)}
                >
                    <FaFilter /> Filters
                </Button>
            </div>

            {showFilters &&
                (<div className="listing-filter-controls w-72 p-5 rounded-lg border border-green-700 mt-3 absolute z-10 bg-white/90 backdrop-blur-lg right-0">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-1">
                            <CurrencyInput
                                inputLabel="Min Price"
                                value={filterObject.priceMin}
                                setValue={(newValue) => {
                                    setFilterObjectAction({ ...filterObject, priceMin: newValue })
                                }}
                            />
                        </div>
                        <div className="col-span-1">
                            <CurrencyInput
                                inputLabel="Max Price"
                                value={filterObject.priceMax}
                                setValue={(newValue) => {
                                    setFilterObjectAction({ ...filterObject, priceMax: newValue })
                                }}
                            />
                        </div>
                        <div className="col-span-2">
                            <TextInput
                                inputLabel="Posted After"
                                type="date"
                                setValue={(newValue) => {
                                    setFilterObjectAction({ ...filterObject, dateMin: new Date(newValue) })
                                }}
                            />
                        </div>
                        <div className="col-span-2">
                            <TextInput
                                inputLabel="Posted Before"
                                type="date"
                                setValue={(newValue) => {
                                    setFilterObjectAction({ ...filterObject, dateMax: new Date(newValue) })
                                }}
                            />
                        </div>
                        <div className="col-span-2">
                            {userRole === UserRole.FACULTY || userRole === UserRole.ADMIN && (
                                <TextInput
                                    inputLabel="Faculty-Only Listings"
                                    type="checkbox"
                                    checked={filterObject.professorOnly ?? false}
                                    setChecked={(newValue) => {
                                        setFilterObjectAction({ ...filterObject, professorOnly: newValue })
                                    }}
                                />
                            )}
                        </div>
                        <div className="col-span-2 flex justify-between items-center">
                            <Button
                                buttonStyle="text"
                                buttonSize="sm"
                                onClick={() => setShowFilters(false)}
                            >
                                Close
                            </Button>

                            <Button
                                onClick={() => {
                                    refreshListingsAction();
                                    setShowFilters(false);
                                }}
                            >
                                Search
                            </Button>
                        </div>

                    </div>
                </div>
                )}
        </div>
    );
}
