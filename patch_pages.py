import re

with open("src/pages/StaticPages.tsx", "r") as f:
    content = f.read()

# 1. Privacy Policy
privacy_target = """      <h2 className="text-xl font-bold mb-4 mt-6">3. Cookies</h2>
      <p className="mb-4">We use local storage strictly for functional purposes, such as remembering your theme preference (Light or Dark mode) and maintaining your recent download history locally on your device. We do not use tracking cookies.</p>
    </StaticPageView>"""
privacy_replacement = """      <h2 className="text-xl font-bold mb-4 mt-6">3. Cookies</h2>
      <p className="mb-4">We use local storage strictly for functional purposes, such as remembering your theme preference (Light or Dark mode) and maintaining your recent download history locally on your device. We do not use tracking cookies.</p>
      
      <h2 className="text-xl font-bold mb-4 mt-6">4. Children's Privacy</h2>
      <p className="mb-4">The service is not directed at children under 13 (or applicable minimum age), and does not knowingly collect data from children.</p>
      
      <h2 className="text-xl font-bold mb-4 mt-6">5. Changes to this Policy</h2>
      <p className="mb-4">The policy may be updated from time to time, with the revision date posted on the page.</p>
    </StaticPageView>"""
content = content.replace(privacy_target, privacy_replacement)

# 2. Terms and Conditions
terms_target = """      <h2 className="text-xl font-bold mb-4 mt-6">3. Disclaimer</h2>
      <p className="mb-4">The materials on Social Downloader are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
    </StaticPageView>"""
terms_replacement = """      <h2 className="text-xl font-bold mb-4 mt-6">3. Disclaimer</h2>
      <p className="mb-4">The materials on Social Downloader are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
      
      <h2 className="text-xl font-bold mb-4 mt-6">4. User Responsibilities</h2>
      <p className="mb-4">Users must comply with the Terms of Service of the platform they are downloading from (YouTube, Instagram, Pinterest, TikTok, etc.). Users must not use the service to download, redistribute, or commercially exploit copyrighted material without permission from the rights holder.</p>
      
      <h2 className="text-xl font-bold mb-4 mt-6">5. Age restriction</h2>
      <p className="mb-4">Users must be at least 13 years old (or the minimum legal age in their country) to use this service.</p>
      
      <h2 className="text-xl font-bold mb-4 mt-6">6. Limitation of Liability</h2>
      <p className="mb-4">The service is not liable for any direct, indirect, incidental, or consequential damages arising from use of the service, including copyright or legal claims arising from content downloaded by users.</p>
      
      <h2 className="text-xl font-bold mb-4 mt-6">7. Modification of Service</h2>
      <p className="mb-4">The company reserves the right to modify, suspend, or discontinue the service at any time without prior notice.</p>
      
      <h2 className="text-xl font-bold mb-4 mt-6">8. Governing Law</h2>
      <p className="mb-4">These Terms are governed by the laws of India, and disputes are subject to the exclusive jurisdiction of the courts of Jaipur, India.</p>
    </StaticPageView>"""
content = content.replace(terms_target, terms_replacement)

# 3. DMCA
dmca_target = """      <p className="mb-4">However, if you wish to block our tool from processing URLs leading to your copyrighted material, you may send a DMCA notice to our support team, and we will implement filters to prevent downloading from those specific URLs.</p>"""
dmca_replacement = """      <p className="mb-4">However, if you wish to block our tool from processing URLs leading to your copyrighted material, you may send a DMCA notice to our legal/DMCA email address at <strong>legal@aura-downloader-yg40.onrender.com</strong>, and we will implement filters to prevent downloading from those specific URLs. Please include: identification of the copyrighted work, the specific URL(s) processed through the tool, your contact information, and a good-faith statement.</p>"""
content = content.replace(dmca_target, dmca_replacement)

# 4. Contact
contact_target = """      <div className="p-6 border rounded-xl bg-black/5 dark:bg-white/5 my-6">
        <h3 className="font-bold text-lg mb-2">Support Channel</h3>
        <p className="mb-4">For the fastest response, please reach out to us via our official YouTube channel.</p>
        <a href="https://youtube.com/@mridulgaming-_-official-800?si=qsAdamH6-973hgBe" target="_blank" rel="noopener noreferrer" className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-full transition-colors">
          Visit Our YouTube Channel
        </a>
      </div>"""
contact_replacement = """      <div className="p-6 border rounded-xl bg-black/5 dark:bg-white/5 my-6">
        <h3 className="font-bold text-lg mb-2">Support Channel</h3>
        <p className="mb-4">For the fastest response, please reach out to us via our official YouTube channel.</p>
        <a href="https://youtube.com/@mridulgaming-_-official-800?si=qsAdamH6-973hgBe" target="_blank" rel="noopener noreferrer" className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-full transition-colors mb-6">
          Visit Our YouTube Channel
        </a>
        <h3 className="font-bold text-lg mb-2">Email Contact</h3>
        <p className="mb-2">Email: <a href="mailto:support@aura-downloader-yg40.onrender.com" className="text-blue-500 hover:underline">support@aura-downloader-yg40.onrender.com</a></p>
        <p>Legal / DMCA inquiries: <a href="mailto:legal@aura-downloader-yg40.onrender.com" className="text-blue-500 hover:underline">legal@aura-downloader-yg40.onrender.com</a></p>
      </div>"""
content = content.replace(contact_target, contact_replacement)

with open("src/pages/StaticPages.tsx", "w") as f:
    f.write(content)

print("StaticPages updated")
