"""
Setup script for PC Agent
Run this on each gaming PC to configure the agent
"""
import os
import sys
import uuid
import yaml
from pathlib import Path

def setup_agent():
    """Interactive setup for PC Agent"""
    print("=" * 60)
    print("GameOps PC Agent Setup")
    print("=" * 60)
    print()
    
    # Get station information
    print("Station Configuration:")
    print("-" * 60)
    
    station_id = input("Enter Station ID (or press Enter to generate): ").strip()
    if not station_id:
        station_id = str(uuid.uuid4())
        print(f"Generated Station ID: {station_id}")
    
    station_name = input("Enter Station Name (e.g., PC-GAMING-01): ").strip()
    if not station_name:
        station_name = f"PC-{uuid.uuid4().hex[:8].upper()}"
        print(f"Generated Station Name: {station_name}")
    
    print()
    print("Backend Configuration:")
    print("-" * 60)
    
    backend_host = input("Enter Backend Host (default: localhost): ").strip() or "localhost"
    backend_port = input("Enter Backend Port (default: 8000): ").strip() or "8000"
    
    backend_url = f"ws://{backend_host}:{backend_port}/ws/agent"
    backend_api_url = f"http://{backend_host}:{backend_port}/api/v1"
    
    print()
    print("Authentication:")
    print("-" * 60)
    agent_token = input("Enter Agent Token (from backend): ").strip()
    
    if not agent_token:
        print("WARNING: No agent token provided. You'll need to set it later.")
        agent_token = "YOUR_TOKEN_HERE"
    
    # Update config.yaml
    config_path = Path("config.yaml")
    if config_path.exists():
        with open(config_path, 'r') as f:
            config = yaml.safe_load(f)
    else:
        config = {}
    
    config['agent'] = config.get('agent', {})
    config['agent']['station_id'] = station_id
    config['agent']['station_name'] = station_name
    
    config['backend'] = config.get('backend', {})
    config['backend']['url'] = backend_url
    config['backend']['api_url'] = backend_api_url
    config['backend']['token'] = agent_token
    
    with open(config_path, 'w') as f:
        yaml.dump(config, f, default_flow_style=False)
    
    # Create .env file
    env_content = f"""# PC Agent Environment Variables
STATION_ID={station_id}
BACKEND_URL={backend_url}
BACKEND_API_URL={backend_api_url}
AGENT_TOKEN={agent_token}
"""
    
    with open('.env', 'w') as f:
        f.write(env_content)
    
    print()
    print("=" * 60)
    print("Setup Complete!")
    print("=" * 60)
    print()
    print("Configuration saved to:")
    print(f"  - config.yaml")
    print(f"  - .env")
    print()
    print("Station Details:")
    print(f"  ID: {station_id}")
    print(f"  Name: {station_name}")
    print(f"  Backend: {backend_host}:{backend_port}")
    print()
    print("Next Steps:")
    print("  1. Register this station in the backend admin panel")
    print("  2. Generate an agent token for this station")
    print("  3. Update the AGENT_TOKEN in .env file")
    print("  4. Run: python main.py")
    print()
    print("To run as Windows Service:")
    print("  Run install_service.bat as Administrator")
    print()

if __name__ == "__main__":
    try:
        setup_agent()
    except KeyboardInterrupt:
        print("\nSetup cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\nError during setup: {e}")
        sys.exit(1)
