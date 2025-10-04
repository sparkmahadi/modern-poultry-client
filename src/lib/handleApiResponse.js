export const handleApiResponse = (response) => {
    if (response.data.success) {
        return response.data.data;
    } else {
        throw new Error(response.data.message || 'An unknown error occurred');
    }
};