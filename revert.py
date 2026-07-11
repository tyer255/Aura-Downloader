import re

with open("server.ts", "r") as f:
    content = f.read()

start_idx = content.find("      // ======= RAPID API INTEGRATION =======")
end_idx = content.find("      // =====================================", start_idx)

if start_idx != -1 and end_idx != -1:
    content = content[:start_idx] + content[end_idx + len("      // =====================================") + 1:]
    
    with open("server.ts", "w") as f:
        f.write(content)
    print("Reverted successfully")
else:
    print("Could not find patch")
