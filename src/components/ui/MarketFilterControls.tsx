"use client"

import React, {Dispatch, SetStateAction, useMemo, useState} from "react";
import {ListingFilters} from "@/types/ListingFilters";
import CurrencyInput from "@/components/ui/CurrencyInput";
import {Category} from "@/generated/prisma";

export default function MarketFilterControls({
    setFilterObjectAction,
    filterObject
}: {
    setFilterObjectAction: React.Dispatch<SetStateAction<ListingFilters>>
    filterObject: ListingFilters;
}) {

    return (
        <div className="listing-filter-controls">
            <div>
                <CurrencyInput
                    value={filterObject.priceMin}
                    setValue={(newValue) => {
                        setFilterObjectAction({ ...filterObject, priceMin: newValue })
                    }}
                />
            </div>

        </div>
    );
}
