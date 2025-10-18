"""
System monitoring - CPU, RAM, Disk usage
"""
import psutil
import platform
import socket
import logging
from typing import Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)

class SystemMonitor:
    """Monitor system resources and status"""
    
    def __init__(self):
        self.hostname = socket.gethostname()
        self.platform = platform.system()
        self.platform_version = platform.version()
    
    def get_system_info(self) -> Dict[str, Any]:
        """Get comprehensive system information"""
        try:
            return {
                "hostname": self.hostname,
                "platform": self.platform,
                "platform_version": self.platform_version,
                "processor": platform.processor(),
                "architecture": platform.machine(),
                "python_version": platform.python_version(),
                "boot_time": datetime.fromtimestamp(psutil.boot_time()).isoformat(),
            }
        except Exception as e:
            logger.error(f"Failed to get system info: {e}")
            return {}
    
    def get_cpu_info(self) -> Dict[str, Any]:
        """Get CPU usage information"""
        try:
            return {
                "percent": psutil.cpu_percent(interval=1),
                "count": psutil.cpu_count(),
                "count_logical": psutil.cpu_count(logical=True),
                "frequency": psutil.cpu_freq()._asdict() if psutil.cpu_freq() else None,
            }
        except Exception as e:
            logger.error(f"Failed to get CPU info: {e}")
            return {"percent": 0}
    
    def get_memory_info(self) -> Dict[str, Any]:
        """Get memory usage information"""
        try:
            mem = psutil.virtual_memory()
            return {
                "total": mem.total,
                "available": mem.available,
                "used": mem.used,
                "percent": mem.percent,
                "total_gb": round(mem.total / (1024**3), 2),
                "available_gb": round(mem.available / (1024**3), 2),
                "used_gb": round(mem.used / (1024**3), 2),
            }
        except Exception as e:
            logger.error(f"Failed to get memory info: {e}")
            return {"percent": 0}
    
    def get_disk_info(self) -> Dict[str, Any]:
        """Get disk usage information"""
        try:
            disk = psutil.disk_usage('/')
            return {
                "total": disk.total,
                "used": disk.used,
                "free": disk.free,
                "percent": disk.percent,
                "total_gb": round(disk.total / (1024**3), 2),
                "used_gb": round(disk.used / (1024**3), 2),
                "free_gb": round(disk.free / (1024**3), 2),
            }
        except Exception as e:
            logger.error(f"Failed to get disk info: {e}")
            return {"percent": 0}
    
    def get_network_info(self) -> Dict[str, Any]:
        """Get network information"""
        try:
            # Get primary network interface
            addrs = psutil.net_if_addrs()
            stats = psutil.net_if_stats()
            
            interfaces = {}
            for interface_name, interface_addresses in addrs.items():
                for address in interface_addresses:
                    if address.family == socket.AF_INET:  # IPv4
                        interfaces[interface_name] = {
                            "ip": address.address,
                            "netmask": address.netmask,
                            "is_up": stats[interface_name].isup if interface_name in stats else False,
                        }
            
            return interfaces
        except Exception as e:
            logger.error(f"Failed to get network info: {e}")
            return {}
    
    def get_process_count(self) -> int:
        """Get number of running processes"""
        try:
            return len(psutil.pids())
        except Exception as e:
            logger.error(f"Failed to get process count: {e}")
            return 0
    
    def get_uptime(self) -> float:
        """Get system uptime in seconds"""
        try:
            boot_time = psutil.boot_time()
            return datetime.now().timestamp() - boot_time
        except Exception as e:
            logger.error(f"Failed to get uptime: {e}")
            return 0
    
    def get_status_report(self) -> Dict[str, Any]:
        """Get comprehensive status report"""
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "system": self.get_system_info(),
            "cpu": self.get_cpu_info(),
            "memory": self.get_memory_info(),
            "disk": self.get_disk_info(),
            "network": self.get_network_info(),
            "process_count": self.get_process_count(),
            "uptime_seconds": self.get_uptime(),
        }
    
    def is_healthy(self) -> bool:
        """Check if system is healthy"""
        try:
            cpu = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory().percent
            disk = psutil.disk_usage('/').percent
            
            # System is healthy if resources are not critically high
            return cpu < 95 and memory < 95 and disk < 95
        except Exception as e:
            logger.error(f"Failed to check system health: {e}")
            return True
