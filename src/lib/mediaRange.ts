export interface ByteRange {
    start: number;
    end: number;
}

export function parseSingleByteRange(rangeHeader: string | null, size: number): ByteRange | null {
    if (!rangeHeader || !Number.isSafeInteger(size) || size <= 0) return null;

    const match = /^bytes=(\d*)-(\d*)$/i.exec(rangeHeader.trim());
    if (!match || (match[1] === '' && match[2] === '')) return null;

    if (match[1] === '') {
        const suffixLength = Number(match[2]);
        if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) return null;
        return { start: Math.max(0, size - suffixLength), end: size - 1 };
    }

    const start = Number(match[1]);
    const requestedEnd = match[2] === '' ? size - 1 : Number(match[2]);
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(requestedEnd)) return null;
    if (start < 0 || start >= size || requestedEnd < start) return null;

    return { start, end: Math.min(requestedEnd, size - 1) };
}
