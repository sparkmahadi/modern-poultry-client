import { useEffect, useState } from "react";

const getLocalDateTime = () => {
    const now = new Date();

    return new Date(
        now.getTime() - now.getTimezoneOffset() * 60000
    )
        .toISOString()
        .slice(0, 16);
};

export const useDateTime = (initialValue = "") => {
    const [dateTime, setDateTime] = useState(initialValue);

    useEffect(() => {
        if (!dateTime) {
            setDateTime(getLocalDateTime());
        }
    }, []);

    return [dateTime, setDateTime];
};