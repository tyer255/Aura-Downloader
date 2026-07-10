import re
with open("src/App.tsx", "r") as f:
    content = f.read()

# We need to find the specific button:
# <button type="button"
#                                         onClick={(e) => { e.preventDefault(); downloadFileClientSide(q.url, filename); }}

target = """<button type="button"
                                        onClick={(e) => { e.preventDefault(); downloadFileClientSide(q.url, filename); }}"""
replacement = """<button type="button"
                                        id={idx === 0 ? "tour-regular-download" : undefined}
                                        onClick={(e) => { e.preventDefault(); downloadFileClientSide(q.url, filename); }}"""

content = content.replace(target, replacement)
with open("src/App.tsx", "w") as f:
    f.write(content)
