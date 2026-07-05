const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const oldDetect = `const detectPlatformFromUrl = (url: string): Tab | null => {
  const lowercase = url.trim().toLowerCase();
  if (!lowercase) return null;
  
  if (lowercase.includes('pinterest.com') || lowercase.includes('pin.it')) {
    return 'pinterest';
  }
  if (lowercase.includes('instagram.com') || lowercase.includes('instagr.am')) {
    return 'instagram';
  }
  if (lowercase.includes('tiktok.com')) {
    return 'tiktok';
  }
  if (lowercase.includes('facebook.com') || lowercase.includes('fb.watch') || lowercase.includes('fb.com')) {
    return 'facebook';
  }
  if (lowercase.includes('reddit.com') || lowercase.includes('redd.it')) {
    return 'reddit';
  }
  if (lowercase.includes('youtube.com') || lowercase.includes('youtu.be')) {
    return 'youtube';
  }
  if (lowercase.includes('x.com') || lowercase.includes('twitter.com')) {
    return 'x';
  }
  if (lowercase.includes('linkedin.com')) {
    return 'linkedin';
  }
  
  return null;
};`;

const newDetect = `const detectPlatformFromUrl = (url: string): Tab | null => {
  const lowercase = url.trim().toLowerCase();
  if (!lowercase) return null;
  
  if (lowercase.includes('pinterest.com') || lowercase.includes('pin.it')) {
    return 'pinterest';
  }
  if (lowercase.includes('instagram.com') || lowercase.includes('instagr.am')) {
    if (lowercase.includes('/reel/') || lowercase.includes('/reels/')) {
      return 'instagram-reels';
    }
    return 'instagram';
  }
  if (lowercase.includes('tiktok.com')) {
    return 'tiktok';
  }
  if (lowercase.includes('facebook.com') || lowercase.includes('fb.watch') || lowercase.includes('fb.com')) {
    return 'facebook';
  }
  if (lowercase.includes('reddit.com') || lowercase.includes('redd.it')) {
    return 'reddit';
  }
  if (lowercase.includes('youtube.com') || lowercase.includes('youtu.be')) {
    if (lowercase.includes('/shorts/')) {
      return 'youtube-shorts';
    }
    return 'youtube';
  }
  if (lowercase.includes('x.com') || lowercase.includes('twitter.com')) {
    return 'x';
  }
  if (lowercase.includes('linkedin.com')) {
    return 'linkedin';
  }
  
  return null;
};`;

content = content.replace(oldDetect, newDetect);
fs.writeFileSync('src/App.tsx', content);
