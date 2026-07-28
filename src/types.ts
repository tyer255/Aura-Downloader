export interface MediaQuality {
    label: string;
    url: string;
    ext?: string;
    size?: string;
}

export interface DownloadResult {
    success: boolean;
    url?: string;
    title?: string;
    description?: string;
    thumbnail?: string;
    mediaType?: 'video' | 'image' | 'profile' | 'carousel' | 'playlist';
    qualities?: MediaQuality[];
    media?: Array<{
        url: string;
        type: 'video' | 'image';
        thumbnail?: string;
        qualities?: MediaQuality[];
    }>;
    profile?: {
        username: string;
        displayName?: string;
        avatarUrl?: string;
        bannerUrl?: string;
        bio?: string;
        followers?: string;
        following?: string;
        postsCount?: string;
    };
    originalUrl?: string;
    error?: string;
    source?: string;
    isFlaskBackend?: boolean;
    availableResolutions?: string[];
    author?: string;
    views?: number;
    length?: number;
}
