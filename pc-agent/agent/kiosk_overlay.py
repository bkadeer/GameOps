"""
Kiosk overlay UI - Shows session time remaining
"""
import tkinter as tk
from tkinter import ttk
import threading
import logging
from datetime import datetime, timedelta
from typing import Optional, Callable

logger = logging.getLogger(__name__)

class KioskOverlay:
    """Minimal overlay showing session time remaining"""
    
    def __init__(self, on_close_callback: Optional[Callable] = None):
        self.root: Optional[tk.Tk] = None
        self.time_label: Optional[tk.Label] = None
        self.status_label: Optional[tk.Label] = None
        self.running = False
        self.thread: Optional[threading.Thread] = None
        self.on_close_callback = on_close_callback
        
        # Session data
        self.session_active = False
        self.end_time: Optional[datetime] = None
        self.session_id: Optional[str] = None
    
    def start(self):
        """Start the overlay in a separate thread"""
        if self.running:
            logger.warning("Overlay already running")
            return
        
        self.running = True
        self.thread = threading.Thread(target=self._run_ui, daemon=True)
        self.thread.start()
        logger.info("Kiosk overlay started")
    
    def stop(self):
        """Stop the overlay"""
        self.running = False
        if self.root:
            try:
                self.root.quit()
            except:
                pass
        logger.info("Kiosk overlay stopped")
    
    def update_session(self, session_data: dict):
        """Update session information"""
        try:
            self.session_active = session_data.get('active', False)
            
            if self.session_active:
                end_time_str = session_data.get('scheduled_end_at')
                if end_time_str:
                    self.end_time = datetime.fromisoformat(end_time_str.replace('Z', '+00:00'))
                self.session_id = session_data.get('session_id')
            else:
                self.end_time = None
                self.session_id = None
            
            logger.debug(f"Session updated: active={self.session_active}")
        except Exception as e:
            logger.error(f"Failed to update session: {e}")
    
    def _run_ui(self):
        """Run the tkinter UI loop"""
        try:
            self.root = tk.Tk()
            self.root.title("GameOps Session")
            
            # Window configuration
            self.root.attributes('-topmost', True)  # Always on top
            self.root.attributes('-alpha', 0.9)  # Slightly transparent
            self.root.overrideredirect(True)  # No window decorations
            
            # Position in top-right corner
            window_width = 300
            window_height = 120
            screen_width = self.root.winfo_screenwidth()
            x_position = screen_width - window_width - 20
            y_position = 20
            
            self.root.geometry(f"{window_width}x{window_height}+{x_position}+{y_position}")
            
            # Style
            style = ttk.Style()
            style.theme_use('clam')
            
            # Main frame
            main_frame = tk.Frame(
                self.root,
                bg='#1a1a1a',
                highlightbackground='#ed6802',
                highlightthickness=2
            )
            main_frame.pack(fill=tk.BOTH, expand=True, padx=2, pady=2)
            
            # Title
            title_label = tk.Label(
                main_frame,
                text="🎮 GameOps Session",
                font=('Segoe UI', 12, 'bold'),
                fg='#ed6802',
                bg='#1a1a1a'
            )
            title_label.pack(pady=(10, 5))
            
            # Time remaining label
            self.time_label = tk.Label(
                main_frame,
                text="No Active Session",
                font=('Segoe UI', 16, 'bold'),
                fg='#ffffff',
                bg='#1a1a1a'
            )
            self.time_label.pack(pady=5)
            
            # Status label
            self.status_label = tk.Label(
                main_frame,
                text="",
                font=('Segoe UI', 9),
                fg='#a0a0a0',
                bg='#1a1a1a'
            )
            self.status_label.pack(pady=(0, 10))
            
            # Close button (small, in corner)
            close_btn = tk.Button(
                main_frame,
                text="×",
                command=self._on_close,
                font=('Segoe UI', 12, 'bold'),
                fg='#ffffff',
                bg='#2a2a2a',
                activebackground='#ed6802',
                activeforeground='#ffffff',
                bd=0,
                width=2,
                height=1,
                cursor='hand2'
            )
            close_btn.place(x=window_width-35, y=5)
            
            # Update timer
            self._update_display()
            
            # Run main loop
            self.root.mainloop()
            
        except Exception as e:
            logger.error(f"Error in overlay UI: {e}")
        finally:
            self.running = False
    
    def _update_display(self):
        """Update the time display"""
        if not self.running or not self.root:
            return
        
        try:
            if self.session_active and self.end_time:
                # Calculate time remaining
                now = datetime.now(self.end_time.tzinfo)
                remaining = self.end_time - now
                
                if remaining.total_seconds() > 0:
                    # Format time
                    hours = int(remaining.total_seconds() // 3600)
                    minutes = int((remaining.total_seconds() % 3600) // 60)
                    seconds = int(remaining.total_seconds() % 60)
                    
                    if hours > 0:
                        time_str = f"{hours:02d}:{minutes:02d}:{seconds:02d}"
                    else:
                        time_str = f"{minutes:02d}:{seconds:02d}"
                    
                    # Color coding based on time remaining
                    if remaining.total_seconds() < 300:  # Less than 5 minutes
                        color = '#ff4444'  # Red
                        status = "⚠️ Session ending soon!"
                    elif remaining.total_seconds() < 600:  # Less than 10 minutes
                        color = '#ffaa00'  # Orange
                        status = "Session active"
                    else:
                        color = '#00ff88'  # Green
                        status = "Session active"
                    
                    self.time_label.config(text=time_str, fg=color)
                    self.status_label.config(text=status)
                else:
                    # Session expired
                    self.time_label.config(text="00:00", fg='#ff4444')
                    self.status_label.config(text="⏰ Session expired")
            else:
                # No active session
                self.time_label.config(text="No Active Session", fg='#a0a0a0')
                self.status_label.config(text="")
            
            # Schedule next update
            self.root.after(1000, self._update_display)
            
        except Exception as e:
            logger.error(f"Error updating display: {e}")
            # Try again in 1 second
            if self.root:
                self.root.after(1000, self._update_display)
    
    def _on_close(self):
        """Handle close button click"""
        if self.on_close_callback:
            self.on_close_callback()
        self.stop()
    
    def show_message(self, title: str, message: str, duration: int = 5000):
        """Show a temporary message"""
        if not self.root:
            return
        
        try:
            # Create a temporary message window
            msg_window = tk.Toplevel(self.root)
            msg_window.title(title)
            msg_window.attributes('-topmost', True)
            msg_window.overrideredirect(True)
            
            # Position below main overlay
            screen_width = self.root.winfo_screenwidth()
            x_position = screen_width - 320
            y_position = 160
            
            msg_window.geometry(f"300x80+{x_position}+{y_position}")
            
            # Frame
            frame = tk.Frame(
                msg_window,
                bg='#2a2a2a',
                highlightbackground='#ed6802',
                highlightthickness=2
            )
            frame.pack(fill=tk.BOTH, expand=True, padx=2, pady=2)
            
            # Title
            title_lbl = tk.Label(
                frame,
                text=title,
                font=('Segoe UI', 10, 'bold'),
                fg='#ed6802',
                bg='#2a2a2a'
            )
            title_lbl.pack(pady=(5, 2))
            
            # Message
            msg_lbl = tk.Label(
                frame,
                text=message,
                font=('Segoe UI', 9),
                fg='#ffffff',
                bg='#2a2a2a',
                wraplength=280
            )
            msg_lbl.pack(pady=(2, 5))
            
            # Auto-close after duration
            msg_window.after(duration, msg_window.destroy)
            
        except Exception as e:
            logger.error(f"Failed to show message: {e}")
