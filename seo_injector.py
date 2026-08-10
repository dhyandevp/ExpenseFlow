import os
import glob
import re

pages_dir = 'client/src/pages'
pages = glob.glob(f"{pages_dir}/*.jsx")

for page in pages:
    if "NotFound" in page:
        continue
    
    with open(page, 'r') as f:
        content = f.read()
        
    if "import SEO from" in content:
        continue
        
    title = os.path.basename(page).replace('.jsx', '')
    if title == "Landing":
        title = "Home"
        
    # Find the function name
    match = re.search(r'export default function (\w+)\(', content)
    if not match:
        print(f"Could not find export default function in {page}")
        continue
        
    comp_name = match.group(1)
    
    # Replace the export line with just function
    new_content = content.replace(f"export default function {comp_name}(", f"function {comp_name}(")
    
    # Append the wrapper at the end
    wrapper = f"""

export default function {comp_name}Wrapper(props) {{
  return (
    <>
      <SEO title="{title}" />
      <{comp_name} {{...props}} />
    </>
  );
}}
"""
    new_content = 'import SEO from "../components/SEO";\n' + new_content + wrapper
    
    with open(page, 'w') as f:
        f.write(new_content)
    print(f"Updated {page}")
