export const parseIds = (req) => {
    if (req.query.ids) {
        return req.query.ids.split(',').map((s) => s.trim()).filter(Boolean);
    }
    return null;
};

export const parseFilters = (req, allowedFields) => {
    const filters = {};
    for (const field of allowedFields) {
        if (req.query[field]) {
            filters[field] = req.query[field];
        }
    }
    return filters;
};
