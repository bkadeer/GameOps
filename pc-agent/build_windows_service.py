"""
Build script for creating Windows Service executable
This creates a standalone .exe that runs as a Windows Service
"""

import PyInstaller.__main__
import os
import shutil

def build_service():
    """Build Windows Service executable"""
    
    # Clean previous builds
    if os.path.exists('dist'):
        shutil.rmtree('dist')
    if os.path.exists('build'):
        shutil.rmtree('build')
    
    print("Building GameOps Agent Windows Service...")
    
    # PyInstaller configuration
    PyInstaller.__main__.run([
        'service_main.py',           # Main service file
        '--onefile',                  # Single executable
        '--noconsole',                # No console window
        '--name=GameOpsAgent',        # Output name
        '--icon=icon.ico',            # Optional: Add icon
        '--add-data=config.ini;.',    # Include config template
        '--hidden-import=win32timezone',
        '--hidden-import=win32service',
        '--hidden-import=win32serviceutil',
        '--hidden-import=win32event',
        '--hidden-import=servicemanager',
        '--clean',
    ])
    
    print("\n✅ Build complete!")
    print(f"📦 Executable: dist/GameOpsAgent.exe")
    print(f"📄 Size: {os.path.getsize('dist/GameOpsAgent.exe') / 1024 / 1024:.2f} MB")
    print("\nDeployment:")
    print("1. Copy GameOpsAgent.exe to each gaming PC")
    print("2. Run: GameOpsAgent.exe --install")
    print("3. Configure: Edit config.ini")
    print("4. Start: GameOpsAgent.exe --start")

if __name__ == '__main__':
    build_service()
