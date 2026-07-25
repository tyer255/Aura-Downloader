async function fastRace(promises: Promise<any>[]): Promise<any> {
    try {
        return await Promise.any(promises.map(async p => {
            const res = await p;
            if (res && res.success && res.media && res.media.length > 0) return res;
            if (res && res.success && res.url) return res;
            throw new Error("fail");
        }));
    } catch {
        return null;
    }
}
