"""
Configuration management for PC Agent
"""
import os
import yaml
from pathlib import Path
from typing import Dict, Any
from dotenv import load_dotenv

class Config:
    """Agent configuration"""
    
    def __init__(self, config_path: str = "config.yaml"):
        self.config_path = Path(config_path)
        self.config: Dict[str, Any] = {}
        self.load_config()
        self.load_env()
    
    def load_config(self):
        """Load configuration from YAML file"""
        if self.config_path.exists():
            with open(self.config_path, 'r') as f:
                self.config = yaml.safe_load(f)
        else:
            raise FileNotFoundError(f"Config file not found: {self.config_path}")
    
    def load_env(self):
        """Load environment variables"""
        load_dotenv()
        
        # Override config with environment variables
        if os.getenv('STATION_ID'):
            self.config['agent']['station_id'] = os.getenv('STATION_ID')
        if os.getenv('BACKEND_URL'):
            self.config['backend']['url'] = os.getenv('BACKEND_URL')
        if os.getenv('BACKEND_API_URL'):
            self.config['backend']['api_url'] = os.getenv('BACKEND_API_URL')
        if os.getenv('AGENT_TOKEN'):
            self.config['backend']['token'] = os.getenv('AGENT_TOKEN')
    
    def get(self, key: str, default: Any = None) -> Any:
        """Get configuration value using dot notation"""
        keys = key.split('.')
        value = self.config
        
        for k in keys:
            if isinstance(value, dict):
                value = value.get(k)
                if value is None:
                    return default
            else:
                return default
        
        return value
    
    def set(self, key: str, value: Any):
        """Set configuration value using dot notation"""
        keys = key.split('.')
        config = self.config
        
        for k in keys[:-1]:
            if k not in config:
                config[k] = {}
            config = config[k]
        
        config[keys[-1]] = value
    
    def save(self):
        """Save configuration to file"""
        with open(self.config_path, 'w') as f:
            yaml.dump(self.config, f, default_flow_style=False)
    
    @property
    def station_id(self) -> str:
        return self.get('agent.station_id', '')
    
    @property
    def station_name(self) -> str:
        return self.get('agent.station_name', 'Unknown')
    
    @property
    def backend_url(self) -> str:
        return self.get('backend.url', 'ws://localhost:8000/ws/agent')
    
    @property
    def backend_api_url(self) -> str:
        return self.get('backend.api_url', 'http://localhost:8000/api/v1')
    
    @property
    def agent_token(self) -> str:
        return self.get('backend.token', '')
    
    @property
    def reconnect_interval(self) -> int:
        return self.get('backend.reconnect_interval', 5)
    
    @property
    def heartbeat_interval(self) -> int:
        return self.get('backend.heartbeat_interval', 30)
    
    @property
    def log_level(self) -> str:
        return self.get('system.log_level', 'INFO')
    
    @property
    def log_file(self) -> str:
        return self.get('system.log_file', 'agent.log')
