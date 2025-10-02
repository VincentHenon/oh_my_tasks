const API_ENDPOINT = process.env.NEXT_PUBLIC_TASKS_API_ENDPOINT ?? '/api/tasks';
const API_KEY = process.env.NEXT_PUBLIC_TASKS_API_KEY ?? '';

const CACHE_NAMESPACE = 'ohmytasks';
const CACHE_VERSION = 'v1';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const storageAvailable = () => {
    if (typeof window === 'undefined') return false;
    try {
        const testKey = '__ohmytasks_test__';
        window.localStorage.setItem(testKey, '1');
        window.localStorage.removeItem(testKey);
        return true;
    } catch (_error) {
        return false;
    }
};

const formatCacheKey = (email = 'anonymous') => `${CACHE_NAMESPACE}:${CACHE_VERSION}:tasks:${email}`;

const getCache = (email) => {
    if (!storageAvailable()) return null;
    const key = formatCacheKey(email);
    try {
        const raw = window.localStorage.getItem(key);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed?.timestamp || !Array.isArray(parsed?.tasks)) return null;
        const isExpired = Date.now() - parsed.timestamp > CACHE_TTL_MS;
        if (isExpired) {
            window.localStorage.removeItem(key);
            return null;
        }
        return parsed;
    } catch (_error) {
        return null;
    }
};

const setCache = (email, tasks) => {
    if (!storageAvailable()) return;
    try {
        window.localStorage.setItem(formatCacheKey(email), JSON.stringify({
            timestamp: Date.now(),
            tasks,
        }));
    } catch (_error) {
        // ignore storage failures silently
    }
};

const clearCache = (email) => {
    if (!storageAvailable()) return;
    window.localStorage.removeItem(formatCacheKey(email));
};

const toBoolean = (value) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (['1', 'true', 'yes', 'y', 'on'].includes(normalized)) return true;
        if (['0', 'false', 'no', 'n', 'off', ''].includes(normalized)) return false;
    }
    return Boolean(value);
};

const normalizeTask = (task = {}) => {
    const name = task?.name ?? task?.title ?? '';
    const title = task?.title ?? task?.name ?? name;

    return {
        ...task,
        id: task?.id ?? task?.task_id ?? task?._id ?? `temp-${Date.now()}-${Math.random()}`,
        name,
        title,
        details: task?.details ?? task?.detail ?? '',
        date: task?.date ?? '',
        time: task?.time ?? '',
        isFullDay: toBoolean(task?.isFullDay ?? task?.is_full_day),
        isUrgent: toBoolean(task?.isUrgent ?? task?.urgent ?? task?.is_urgent),
        urgent: toBoolean(task?.urgent ?? task?.isUrgent ?? task?.is_urgent),
        completed: toBoolean(task?.completed ?? task?.isCompleted ?? task?.is_completed),
        tags: task?.tags ?? '',
        priority: task?.priority ?? 'medium',
        email: task?.email ?? '',
        createdAt: task?.createdAt ?? task?.created_at ?? null,
    };
};

const extractTasksFromPayload = (payload, depth = 0) => {
    if (!payload || depth > 6) return [];

    if (Array.isArray(payload)) {
        return payload;
    }

    if (typeof payload === 'string') {
        try {
            const parsed = JSON.parse(payload);
            return extractTasksFromPayload(parsed, depth + 1);
        } catch (_error) {
            return [];
        }
    }

    if (typeof payload !== 'object') {
        return [];
    }

    const preferredKeys = ['tasks', 'data', 'items', 'results', 'records', 'rows'];
    for (const key of preferredKeys) {
        if (key in payload) {
            const extracted = extractTasksFromPayload(payload[key], depth + 1);
            if (Array.isArray(extracted) && extracted.length > 0) {
                return extracted;
            }
        }
    }

    if ('payload' in payload) {
        const extracted = extractTasksFromPayload(payload.payload, depth + 1);
        if (Array.isArray(extracted) && extracted.length > 0) {
            return extracted;
        }
    }

    const objectValues = Object.values(payload).filter((value) => value && typeof value === 'object');
    if (objectValues.length > 0 && objectValues.every((value) => !Array.isArray(value))) {
        const looksLikeTasks = objectValues.some((value) =>
            value && (
                value.id !== undefined ||
                value.title !== undefined ||
                value.name !== undefined ||
                value.task_id !== undefined
            )
        );
        if (looksLikeTasks) {
            return objectValues;
        }
    }

    for (const value of Object.values(payload)) {
        const extracted = extractTasksFromPayload(value, depth + 1);
        if (Array.isArray(extracted) && extracted.length > 0) {
            return extracted;
        }
    }

    return [];
};

const buildHeaders = () => ({
    'Content-Type': 'application/json',
    ...(API_KEY ? { 'x-api-key': API_KEY, 'X-API-KEY': API_KEY } : {}),
});

const buildUrl = (query) => {
    try {
        const url = new URL(API_ENDPOINT, typeof window !== 'undefined' ? window.location.origin : undefined);
        if (query) {
            const params = typeof query === 'string' ? new URLSearchParams(query) : query;
            params.forEach((value, key) => {
                url.searchParams.set(key, value);
            });
        }
        return url.toString();
    } catch (_error) {
        return query ? `${API_ENDPOINT}?${query.toString()}` : API_ENDPOINT;
    }
};

export const fetchTasks = async ({ email, cache = true } = {}) => {
    const emailKey = email ?? 'anonymous';
    if (cache) {
        const cached = getCache(emailKey);
        if (cached) {
            return { tasks: cached.tasks, source: 'cache', cachedAt: cached.timestamp };
        }
    }

    const url = buildUrl(email ? new URLSearchParams({ email }) : undefined);
    const response = await fetch(url, {
        method: 'GET',
        headers: buildHeaders(),
        cache: 'no-store',
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const payload = await response.json();
    const rawTasks = extractTasksFromPayload(payload);
    const normalizedTasks = rawTasks.map(normalizeTask);

    if (cache) {
        setCache(emailKey, normalizedTasks);
    }

    return { tasks: normalizedTasks, source: 'network', payload };
};

export const createTask = async ({ email, task }) => {
    if (!email) throw new Error('Email is required to create a task');
    const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify({ ...task, email }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok || payload?.success === false) {
        throw new Error(payload?.error || `Failed to create task (status ${response.status})`);
    }

    clearCache(email);

    const createdTask = Array.isArray(payload)
        ? payload[0]
        : payload?.task ?? payload?.createdTask ?? payload?.data ?? payload;

    return normalizeTask(createdTask ?? { ...task, email });
};

export const updateTask = async ({ email, id, updates }) => {
    if (!email) throw new Error('Email is required to update a task');
    if (!id) throw new Error('Task id is required');

    const url = buildUrl(new URLSearchParams({ id, email }));

    const response = await fetch(url, {
        method: 'PUT',
        headers: buildHeaders(),
        body: JSON.stringify({ ...updates, email }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok || payload?.success === false) {
        throw new Error(payload?.error || `Failed to update task (status ${response.status})`);
    }

    clearCache(email);

    const updatedTask = Array.isArray(payload)
        ? payload[0]
        : payload?.task ?? payload?.updatedTask ?? payload?.data ?? payload;

    return normalizeTask(updatedTask ?? { id, ...updates, email });
};

export const deleteTask = async ({ email, id }) => {
    if (!email) throw new Error('Email is required to delete a task');
    if (!id) throw new Error('Task id is required');

    const url = buildUrl(new URLSearchParams({ id, email }));

    const response = await fetch(url, {
        method: 'DELETE',
        headers: buildHeaders(),
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        throw new Error(`Failed to delete task (status ${response.status}): ${errorText}`);
    }

    clearCache(email);
    return true;
};

export const tasksClient = {
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    normalizeTask,
    toBoolean,
};

export default tasksClient;
