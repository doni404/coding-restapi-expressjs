export function getPaginationParams(query) {
    const limit = parseInt(query.limit) || 10;
    const offset = parseInt(query.offset) || 0;
    const sortQuery = query.sort || 'created_at.asc';

    const [field, direction] = sortQuery.split('.');
    const sort = {
        field,
        direction: direction === 'desc' ? 'DESC' : 'ASC',
    };

    return {
        limit,
        offset,
        sort,
    };
}