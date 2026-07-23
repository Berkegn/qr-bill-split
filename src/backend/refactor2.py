import os
import re

for root, dirs, files in os.walk('API/Controllers'):
    for file in files:
        if file.endswith('.cs'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r') as f:
                content = f.read()

            content = content.replace('AppDbContext', 'IAppDbContext')

            with open(filepath, 'w') as f:
                f.write(content)

# Update Program.cs to register IAppDbContext
program_path = 'API/Program.cs'
if os.path.exists(program_path):
    with open(program_path, 'r') as f:
        prog = f.read()
    
    # Add dependency injection
    injection_code = """
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<IAppDbContext>(provider => provider.GetRequiredService<AppDbContext>());
"""
    if 'AddScoped<IAppDbContext>' not in prog:
        prog = re.sub(r'builder\.Services\.AddDbContext<AppDbContext>.*?;\s*', injection_code.strip() + '\n', prog, flags=re.DOTALL)
    
    with open(program_path, 'w') as f:
        f.write(prog)
