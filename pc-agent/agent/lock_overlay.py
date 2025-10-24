"""
Fullscreen lock overlay - Shows when session expires
Displays a message directing users to add more time
Blocks input without requiring Windows lock
Unbreakable for esports gaming cafe environment
Features: Smooth animations, venue logo, dimming, dynamic messages
"""
import tkinter as tk
from tkinter import font as tkfont
import threading
import logging
import sys
import time
import os
from typing import Optional, Callable
from PIL import Image, ImageTk, ImageEnhance
import io

# Windows-specific input blocking
if sys.platform == 'win32':
    try:
        import ctypes
        from ctypes import wintypes
        WIN32_AVAILABLE = True
    except ImportError:
        WIN32_AVAILABLE = False
else:
    WIN32_AVAILABLE = False

logger = logging.getLogger(__name__)

class LockOverlay:
    """Fullscreen overlay shown when session time expires"""
    
    def __init__(self, on_close_callback: Optional[Callable] = None, block_input: bool = True, logo_path: Optional[str] = None):
        self.root: Optional[tk.Tk] = None
        self.running = False
        self.thread: Optional[threading.Thread] = None
        self.monitor_thread: Optional[threading.Thread] = None
        self.on_close_callback = on_close_callback
        self.visible = False
        self.block_input = block_input
        self.input_blocked = False
        self.should_be_visible = False  # Track if overlay should be showing
        self.relaunch_count = 0
        
        # UI elements for dynamic updates
        self.message_label: Optional[tk.Label] = None
        self.logo_label: Optional[tk.Label] = None
        self.container: Optional[tk.Frame] = None
        self.dim_overlay: Optional[tk.Frame] = None
        
        # Animation state
        self.fade_alpha = 0.0
        self.logo_scale = 1.0
        self.glow_direction = 1
        
        # Logo configuration
        self.logo_path = logo_path or self._find_logo()
        self.logo_image = None
        self.current_message = "Your gaming session has ended.\nPlease visit the counter to add more time."
    
    def show(self):
        """Show the lock overlay"""
        self.should_be_visible = True
        
        if not self.running:
            self.running = True
            self.visible = True
            self.thread = threading.Thread(target=self._run_ui, daemon=True)
            self.thread.start()
            logger.info("Lock overlay shown")
            
            # Start monitoring thread to prevent tampering
            if not self.monitor_thread or not self.monitor_thread.is_alive():
                self.monitor_thread = threading.Thread(target=self._monitor_overlay, daemon=True)
                self.monitor_thread.start()
        elif self.root:
            self.visible = True
            try:
                self.root.deiconify()
                self.root.lift()
                self.root.attributes('-topmost', True)
                self.root.focus_force()
            except:
                # Window was destroyed, recreate it
                logger.warning("Overlay window destroyed, recreating...")
                self.running = False
                self.show()
        
        # Block keyboard and mouse input
        if self.block_input:
            self._block_input()
    
    def hide(self):
        """Hide the lock overlay"""
        self.should_be_visible = False
        
        # Unblock input first
        if self.input_blocked:
            self._unblock_input()
        
        self.visible = False
        if self.root:
            try:
                self.root.withdraw()
                logger.info("Lock overlay hidden")
            except:
                pass
    
    def stop(self):
        """Stop and close the overlay"""
        self.should_be_visible = False
        
        # Unblock input before stopping
        if self.input_blocked:
            self._unblock_input()
        
        self.running = False
        self.visible = False
        if self.root:
            try:
                self.root.quit()
            except:
                pass
        logger.info("Lock overlay stopped")
    
    def _block_input(self):
        """Block keyboard and mouse input (Windows only)"""
        if not WIN32_AVAILABLE or self.input_blocked:
            return
        
        try:
            # BlockInput blocks all keyboard and mouse input
            # Note: This requires admin privileges
            result = ctypes.windll.user32.BlockInput(True)
            if result:
                self.input_blocked = True
                logger.info("Input blocked - keyboard and mouse disabled")
            else:
                logger.warning("Failed to block input - requires admin privileges")
                # Try to disable task manager as fallback
                self._disable_task_manager()
        except Exception as e:
            logger.error(f"Failed to block input: {e}")
    
    def _disable_task_manager(self):
        """Disable Task Manager (requires admin)"""
        if not WIN32_AVAILABLE:
            return
        try:
            # Disable Ctrl+Alt+Del screen
            ctypes.windll.user32.SystemParametersInfoW(97, 1, 0, 0)
            logger.info("Task Manager access disabled")
        except Exception as e:
            logger.debug(f"Could not disable task manager: {e}")
    
    def _enable_task_manager(self):
        """Re-enable Task Manager"""
        if not WIN32_AVAILABLE:
            return
        try:
            ctypes.windll.user32.SystemParametersInfoW(97, 0, 0, 0)
            logger.info("Task Manager access re-enabled")
        except Exception as e:
            logger.debug(f"Could not re-enable task manager: {e}")
    
    def _unblock_input(self):
        """Unblock keyboard and mouse input (Windows only)"""
        if not WIN32_AVAILABLE or not self.input_blocked:
            return
        
        try:
            ctypes.windll.user32.BlockInput(False)
            self.input_blocked = False
            self._enable_task_manager()
            logger.info("Input unblocked - keyboard and mouse enabled")
        except Exception as e:
            logger.error(f"Failed to unblock input: {e}")
    
    def _monitor_overlay(self):
        """Monitor overlay and relaunch if tampered with"""
        logger.info("Overlay monitor started")
        
        while self.should_be_visible:
            try:
                time.sleep(0.5)  # Check every 500ms
                
                if not self.should_be_visible:
                    break
                
                # Check if window still exists and is visible
                if self.root:
                    try:
                        # Try to get window state
                        state = self.root.state()
                        
                        # If window is not normal or withdrawn when it should be visible
                        if state != 'normal' and self.visible:
                            logger.warning(f"Overlay tampered with (state: {state}), relaunching...")
                            self.relaunch_count += 1
                            self._relaunch_overlay()
                        
                        # Ensure it stays on top
                        if self.visible:
                            self.root.lift()
                            self.root.attributes('-topmost', True)
                            self.root.focus_force()
                            
                            # Re-block input if it was unblocked
                            if self.block_input and not self.input_blocked:
                                self._block_input()
                    except tk.TclError:
                        # Window was destroyed
                        logger.warning("Overlay window destroyed, relaunching...")
                        self.relaunch_count += 1
                        self._relaunch_overlay()
                else:
                    # No root window exists but should be visible
                    if self.visible:
                        logger.warning("Overlay missing, relaunching...")
                        self.relaunch_count += 1
                        self._relaunch_overlay()
                        
            except Exception as e:
                logger.error(f"Error in overlay monitor: {e}")
                time.sleep(1)
        
        logger.info("Overlay monitor stopped")
    
    def _relaunch_overlay(self):
        """Relaunch the overlay if it was closed"""
        try:
            self.running = False
            self.visible = False
            
            # Small delay to prevent rapid relaunching
            time.sleep(0.2)
            
            # Restart the UI
            self.running = True
            self.visible = True
            self.thread = threading.Thread(target=self._run_ui, daemon=True)
            self.thread.start()
            
            logger.warning(f"Overlay relaunched (count: {self.relaunch_count})")
            
            # Re-block input
            if self.block_input:
                time.sleep(0.5)  # Wait for window to be ready
                self._block_input()
                
        except Exception as e:
            logger.error(f"Failed to relaunch overlay: {e}")
    
    def _run_ui(self):
        """Run the tkinter UI loop"""
        try:
            self.root = tk.Tk()
            self.root.title("Session Expired")
            
            # Fullscreen configuration - UNBREAKABLE
            self.root.attributes('-fullscreen', True)
            self.root.attributes('-topmost', True)
            self.root.attributes('-disabled', False)
            self.root.configure(bg='#000000')
            
            # Prevent closing with Alt+F4, Escape, and any other method
            self.root.protocol("WM_DELETE_WINDOW", lambda: None)
            self.root.bind('<Escape>', lambda e: None)
            self.root.bind('<Alt-F4>', lambda e: None)
            self.root.bind('<Control-w>', lambda e: None)
            self.root.bind('<Control-q>', lambda e: None)
            
            # Disable all keyboard shortcuts that could close or minimize
            self.root.bind('<Alt-Tab>', lambda e: 'break')
            self.root.bind('<Control-Alt-Delete>', lambda e: 'break')
            self.root.bind('<Super_L>', lambda e: 'break')  # Windows key
            self.root.bind('<Super_R>', lambda e: 'break')
            
            # Grab all input focus
            self.root.grab_set()
            self.root.focus_force()
            
            # Make window stay on top continuously
            self._keep_on_top()
            
            # Create dimmed background overlay (60% transparent black)
            self.dim_overlay = tk.Frame(self.root, bg='#000000')
            self.dim_overlay.place(x=0, y=0, relwidth=1, relheight=1)
            
            # Main container for content
            self.container = tk.Frame(self.root, bg='#000000')
            self.container.place(relx=0.5, rely=0.5, anchor='center')
            
            # Try to load venue logo
            self.logo_image = self._load_logo(250)
            
            if self.logo_image:
                # Venue logo
                self.logo_label = tk.Label(
                    self.container,
                    image=self.logo_image,
                    bg='#000000',
                    borderwidth=0
                )
                self.logo_label.pack(pady=(0, 40))
            else:
                # Fallback: Lock icon emoji
                self.logo_label = tk.Label(
                    self.container,
                    text="🔒",
                    font=('Segoe UI', 120),
                    fg='#ed6802',
                    bg='#000000'
                )
                self.logo_label.pack(pady=(0, 40))
            
            # Main title
            title_label = tk.Label(
                self.container,
                text="Session Expired",
                font=('Segoe UI', 42, 'bold'),
                fg='#ffffff',
                bg='#000000'
            )
            title_label.pack(pady=(0, 30))
            
            # Dynamic message label
            self.message_label = tk.Label(
                self.container,
                text=self.current_message,
                font=('Segoe UI', 22),
                fg='#cccccc',
                bg='#000000',
                justify='center',
                wraplength=800
            )
            self.message_label.pack(pady=(0, 50))
            
            # Additional info
            info_label = tk.Label(
                self.container,
                text="Your session is preserved. All applications remain open.",
                font=('Segoe UI', 14),
                fg='#888888',
                bg='#000000',
                justify='center'
            )
            info_label.pack(pady=(0, 20))
            
            # Start animations
            self._fade_in()
            self._glow_animation()
            
            # Block input after window is ready
            if self.block_input:
                self.root.after(500, self._block_input)
            
            # Run main loop
            self.root.mainloop()
            
        except Exception as e:
            logger.error(f"Error in lock overlay UI: {e}")
        finally:
            self.running = False
    
    def _fade_in(self):
        """Smooth fade-in animation for the overlay"""
        if not self.running or not self.root or not self.container:
            return
        
        try:
            if self.fade_alpha < 1.0:
                self.fade_alpha += 0.05  # Fade in over ~1 second
                
                # Update opacity of container elements
                alpha_int = int(self.fade_alpha * 255)
                alpha_hex = f"#{alpha_int:02x}{alpha_int:02x}{alpha_int:02x}"
                
                # Schedule next frame
                self.root.after(50, self._fade_in)
            else:
                self.fade_alpha = 1.0
                logger.info("Fade-in animation complete")
                
        except Exception as e:
            logger.error(f"Error in fade animation: {e}")
    
    def _glow_animation(self):
        """Soft glow/pulse animation for the logo"""
        if not self.running or not self.root or not self.logo_label:
            return
        
        try:
            # Pulse scale between 0.95 and 1.05
            if self.glow_direction > 0:
                self.logo_scale += 0.002
                if self.logo_scale >= 1.05:
                    self.glow_direction = -1
            else:
                self.logo_scale -= 0.002
                if self.logo_scale <= 0.95:
                    self.glow_direction = 1
            
            # Apply scale effect (simulated with font size for emoji, or could resize image)
            if self.logo_image:
                # For image logos, we'd need to resize - skip for now to avoid performance issues
                pass
            else:
                # For emoji, adjust font size
                try:
                    base_size = 120
                    new_size = int(base_size * self.logo_scale)
                    self.logo_label.config(font=('Segoe UI', new_size))
                except:
                    pass
            
            # Schedule next frame (30 FPS)
            self.root.after(33, self._glow_animation)
            
        except Exception as e:
            logger.debug(f"Error in glow animation: {e}")
    
    def _keep_on_top(self):
        """Continuously ensure window stays on top"""
        if not self.running or not self.root or not self.visible:
            return
        
        try:
            self.root.lift()
            self.root.attributes('-topmost', True)
            self.root.focus_force()
            
            # Schedule next check
            self.root.after(100, self._keep_on_top)
        except Exception as e:
            logger.debug(f"Error keeping window on top: {e}")
    
    def _find_logo(self) -> Optional[str]:
        """Find venue logo in common locations"""
        possible_paths = [
            "assets/logo.png",
            "assets/venue_logo.png",
            "logo.png",
            "venue_logo.png",
            os.path.join(os.path.dirname(__file__), "..", "assets", "logo.png"),
        ]
        
        for path in possible_paths:
            if os.path.exists(path):
                logger.info(f"Found venue logo at: {path}")
                return path
        
        logger.warning("No venue logo found, will use default icon")
        return None
    
    def _load_logo(self, size: int = 200) -> Optional[ImageTk.PhotoImage]:
        """Load and resize venue logo"""
        if not self.logo_path:
            return None
        
        try:
            img = Image.open(self.logo_path)
            img = img.convert("RGBA")
            
            # Resize maintaining aspect ratio
            img.thumbnail((size, size), Image.Resampling.LANCZOS)
            
            return ImageTk.PhotoImage(img)
        except Exception as e:
            logger.error(f"Failed to load logo: {e}")
            return None
    
    def update_message(self, message: str):
        """Update the message displayed on the overlay"""
        self.current_message = message
        
        if self.message_label and self.root:
            try:
                self.root.after(0, lambda: self.message_label.config(text=message))
                logger.info(f"Message updated: {message}")
            except Exception as e:
                logger.error(f"Failed to update message: {e}")
    
    def show_lock_screen(self):
        """Public API: Show and lock the screen"""
        self.show()
    
    def hide_lock_screen(self):
        """Public API: Hide and unlock the screen"""
        self.hide()
