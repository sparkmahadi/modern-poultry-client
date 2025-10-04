export
 // Helper function to format date strings
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString.trim());
            if (isNaN(date.getTime())) {
                throw new Error("Invalid Date");
            }
            return date.toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (e) {
            console.error("Invalid date string for formatting:", dateString, e);
            return 'Invalid Date';
        }
    };