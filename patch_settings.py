import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# 1. Update Glassmorphic Drawer Style
content = content.replace(
    '''className={clsx(
                "fixed top-0 right-0 h-full w-full sm:w-[400px] z-50 flex flex-col transition-colors duration-700 shadow-2xl",
                isLight ? "bg-white text-neutral-900 border-l border-neutral-200" : "bg-[#0c0a09] text-white border-l border-white/10"
              )}''',
    '''className={clsx(
                "fixed top-0 right-0 h-full w-full sm:w-[400px] z-50 flex flex-col transition-colors duration-700 shadow-2xl backdrop-blur-2xl",
                isLight ? "bg-white/70 text-neutral-900 border-l border-white/50" : "bg-[#0c0a09]/70 text-white border-l border-white/10"
              )}'''
)

# 2. Update English instructions and options
content = content.replace(
    '''<p className="text-sm opacity-70">Throttle your download speed if you are on a limited or unstable connection to prevent timeouts.</p>''',
    '''<p className="text-sm opacity-70">Choose your download speed. If your internet is slow or disconnecting, pick a slower speed so your download doesn't fail.</p>'''
)

content = content.replace(
    '''{ value: 'unlimited', label: 'Unlimited (Default)' },''',
    '''{ value: 'unlimited', label: 'Maximum Speed (Default)' },'''
)
content = content.replace(
    '''{ value: '5', label: '5 MB/s (Fast)' },''',
    '''{ value: '5', label: 'Fast (Good for most)' },'''
)
content = content.replace(
    '''{ value: '2', label: '2 MB/s (Moderate)' },''',
    '''{ value: '2', label: 'Medium (For slow Wi-Fi)' },'''
)
content = content.replace(
    '''{ value: '1', label: '1 MB/s (Slow/Stable)' },''',
    '''{ value: '1', label: 'Slow (For weak mobile data)' },'''
)

# Update the Header for glassmorphism
content = content.replace(
    '''{/* Header */}
              <div className="px-8 py-7 flex justify-between items-center shrink-0 relative border-b border-neutral-200 dark:border-white/10">''',
    '''{/* Header */}
              <div className="px-8 py-7 flex justify-between items-center shrink-0 relative border-b border-neutral-200/50 dark:border-white/10">'''
)

# Fix items border for glassmorphism
content = content.replace(
    '''border-neutral-200 hover:border-neutral-300"''',
    '''border-neutral-200/50 hover:border-neutral-300 bg-white/40"'''
)
content = content.replace(
    '''border-white/10 hover:border-white/20"''',
    '''border-white/10 hover:border-white/20 bg-black/40"'''
)
content = content.replace(
    '''border-blue-500 bg-blue-50/50 text-blue-700"''',
    '''border-blue-500 bg-blue-50/70 text-blue-700"'''
)
content = content.replace(
    '''border-blue-500 bg-blue-500/10 text-blue-400"''',
    '''border-blue-500 bg-blue-500/20 text-blue-400"'''
)


with open("src/App.tsx", "w") as f:
    f.write(content)

print("Settings patched")
